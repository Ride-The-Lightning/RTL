import jwt from 'jsonwebtoken';
import csurf from 'csurf/index.js';
import { Common } from './common.js';
import { Logger } from './logger.js';
const common = Common;
const logger = Logger;
const csurfProtection = csurf({ cookie: true });
export const isAuthenticated = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        jwt.verify(token, common.secret_key);
        next();
    }
    catch (error) {
        const errMsg = 'Authentication Failed! Please Login First!';
        const err = common.handleError({ statusCode: 401, message: 'Authentication Error', error: errMsg }, 'AuthCheck', errMsg, req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    }
};
export const verifyWSUser = (info, next) => {
    var _a;
    const headers = JSON.parse(JSON.stringify(info.req.headers));
    const protocols = !info.req.headers['sec-websocket-protocol'] ? [] : (_a = info.req.headers['sec-websocket-protocol'].split(',')) === null || _a === void 0 ? void 0 : _a.map((s) => s.trim());
    const jwToken = (protocols && protocols.length > 0) ? protocols[0] : '';
    if (!jwToken || jwToken === '') {
        next(false, 401, 'Authentication Failed! Please Login First!');
    }
    else {
        jwt.verify(jwToken, common.secret_key, (verificationErr) => {
            var _a, _b, _c;
            if (verificationErr) {
                next(false, 401, 'Authentication Failed! Please Login First!');
            }
            else {
                try {
                    let updatedReq = null;
                    try {
                        updatedReq = JSON.parse(JSON.stringify(info.req));
                    }
                    catch (err) {
                        updatedReq = info.req;
                    }
                    let cookies = null;
                    try {
                        cookies = '{"' + ((_c = (_b = (_a = headers.cookie) === null || _a === void 0 ? void 0 : _a.replace(/ /g, '')) === null || _b === void 0 ? void 0 : _b.replace(/;/g, '","').trim()) === null || _c === void 0 ? void 0 : _c.replace(/[=]/g, '":"')) + '"}';
                        updatedReq['cookies'] = JSON.parse(cookies);
                    }
                    catch (err) {
                        cookies = {};
                        updatedReq['cookies'] = JSON.parse(cookies);
                        logger.log({ selectedNode: common.initSelectedNode, level: 'WARN', fileName: 'AuthCheck', msg: '403 Unable to read CSRF token cookie', data: err });
                    }
                    csurfProtection(updatedReq, null, (err) => {
                        if (err) {
                            next(false, 403, 'Invalid CSRF token!');
                        }
                        else {
                            next(true);
                        }
                    });
                }
                catch (err) {
                    logger.log({ selectedNode: common.initSelectedNode, level: 'WARN', fileName: 'AuthCheck', msg: '403 Unable to verify CSRF token', data: err });
                    next(true);
                }
            }
        });
    }
};
