import axios from 'axios';
import * as https from 'https';
// Drop-in replacement for the deprecated request-promise, backed by axios.
// Accepts the same options shape used across the controllers ({ url, baseUrl,
// uri, qs, form, body, headers, rejectUnauthorized, json }), resolves with the
// response body directly and rejects with a plain, serializable object that
// mirrors request-promise's StatusCodeError/RequestError shape expected by
// CommonService.handleError. Auth headers are intentionally excluded from the
// rejected error so they can never leak into logs or API error responses.
const insecureAgent = new https.Agent({ rejectUnauthorized: false });
const buildConfig = (options, method) => {
    const config = {
        url: options.url && options.url !== '' ? options.url : options.uri,
        method: method || options.method || 'GET',
        headers: options.headers ? { ...options.headers } : {},
        // Bound hung upstreams; 10 minutes accommodates the slowest legitimate
        // operations (LND's /v2/router/send streams up to timeout_seconds=600 and
        // slow CLN channel operations get req.setTimeout(600000) upstream).
        timeout: 600000
    };
    if (options.baseUrl) {
        config.baseURL = options.baseUrl;
    }
    if (options.qs && Object.keys(options.qs).length > 0) {
        config.params = options.qs;
    }
    if (options.rejectUnauthorized === false) {
        config.httpsAgent = insecureAgent;
    }
    if (options.form !== null && options.form !== undefined) {
        if (typeof options.form === 'string') {
            // Pre-encoded (or raw JSON string for LND's wallet endpoints), send as-is.
            config.data = options.form;
        }
        else {
            const params = new URLSearchParams();
            Object.entries(options.form).forEach(([key, value]) => {
                if (value === null || value === undefined) {
                    return;
                }
                if (Array.isArray(value)) {
                    // Eclair parses list fields as comma-separated values; omit empty lists
                    // (request-promise's qs encoding also dropped them).
                    if (value.length > 0) {
                        params.append(key, value.join(','));
                    }
                }
                else {
                    params.append(key, String(value));
                }
            });
            config.data = params;
        }
        config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }
    else if (options.body !== null && options.body !== undefined) {
        config.data = options.body;
    }
    if (options.json !== true) {
        // Callers without json: true (block explorer, currency rates) JSON.parse the body themselves.
        config.responseType = 'text';
        config.transformResponse = [(data) => data];
    }
    return config;
};
const toRequestPromiseError = (err, config) => {
    const errOptions = { url: config.url, method: config.method };
    if (err.response) {
        return {
            name: 'StatusCodeError',
            statusCode: err.response.status,
            message: err.response.status + ' - ' + JSON.stringify(err.response.data),
            error: err.response.data,
            options: errOptions
        };
    }
    const message = err.message && err.message !== '' ? err.message : err.code;
    return {
        name: 'RequestError',
        message: message,
        error: { code: err.code, message: message },
        options: errOptions
    };
};
const call = (options, method) => {
    const config = buildConfig(options, method);
    return axios.request(config).then((response) => response.data).catch((err) => Promise.reject(toRequestPromiseError(err, config)));
};
const request = (options) => call(options);
request.get = (options) => call(options, 'GET');
request.post = (options) => call(options, 'POST');
request.put = (options) => call(options, 'PUT');
request.delete = (options) => call(options, 'DELETE');
export default request;
