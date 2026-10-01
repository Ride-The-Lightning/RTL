import atob from 'atob';
import request from '../../utils/request.js';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
let options = null;
const logger = Logger;
const common = Common;
// The wallet password and seed passphrase arrive base64-encoded, the way window.btoa produces
// them. Returns undefined when the value is absent and null when it is not well-formed base64.
const BASE64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const parseBase64 = (value) => {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    return (typeof value === 'string' && BASE64.test(value)) ? value : null;
};
// LND takes them as base64 of the UTF-8 text.
const toLndBase64 = (value) => Buffer.from(atob(value)).toString('base64');
const invalidBase64 = (res, name) => common.invalidQueryParam(res, name, 'a base64 string');
export const genSeed = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Wallet', msg: 'Generating Seed..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    // The optional seed passphrase arrives base64-encoded in the request body, as it does for
    // initwallet, and goes to LND through qs so that '+', '/' and '=' are percent-encoded.
    const passphrase = parseBase64(req.body?.aezeed_passphrase);
    if (passphrase === null) {
        return invalidBase64(res, 'aezeed_passphrase');
    }
    // The request gets its own copy of the options, so the passphrase stays out of the ones the
    // session keeps for the node.
    const seedOptions = {
        ...options,
        url: req.session.selectedNode.settings.lnServerUrl + '/v1/genseed',
        qs: passphrase ? { aezeed_passphrase: toLndBase64(passphrase) } : {}
    };
    request(seedOptions).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Wallet', msg: 'Seed Generated' });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Wallet', 'Gen Seed Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const operateWallet = (req, res, next) => {
    const { wallet_password, aezeed_passphrase, cipher_seed_mnemonic } = req.body || {};
    let err_message = '';
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    const password = parseBase64(wallet_password);
    if (!password) {
        return invalidBase64(res, 'wallet_password');
    }
    // The request gets its own copy of the options, so the body stays out of the ones the
    // session keeps for the node.
    const walletOptions = { ...options, method: 'POST' };
    if (!req.params.operation || req.params.operation === 'unlockwallet') {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Wallet', msg: 'Unlocking Wallet..' });
        walletOptions.url = req.session.selectedNode.settings.lnServerUrl + '/v1/unlockwallet';
        walletOptions.form = JSON.stringify({
            wallet_password: toLndBase64(password)
        });
        err_message = 'Unlocking wallet failed! Verify that lnd is running and the wallet is locked!';
    }
    else {
        const passphrase = parseBase64(aezeed_passphrase);
        if (passphrase === null) {
            return invalidBase64(res, 'aezeed_passphrase');
        }
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Wallet', msg: 'Initializing Wallet..' });
        walletOptions.url = req.session.selectedNode.settings.lnServerUrl + '/v1/initwallet';
        if (passphrase) {
            walletOptions.form = JSON.stringify({
                wallet_password: toLndBase64(password),
                cipher_seed_mnemonic: cipher_seed_mnemonic,
                aezeed_passphrase: toLndBase64(passphrase)
            });
        }
        else {
            walletOptions.form = JSON.stringify({
                wallet_password: toLndBase64(password),
                cipher_seed_mnemonic: cipher_seed_mnemonic
            });
        }
        err_message = 'Initializing wallet failed!';
    }
    request(walletOptions).then((body) => {
        const body_str = (!body) ? '' : JSON.stringify(body);
        const search_idx = (!body) ? -1 : body_str.search('Not Found');
        if (!body) {
            const err = common.handleError({ statusCode: 500, message: 'Wallet Error', error: err_message }, 'Wallet', err_message, req.session.selectedNode);
            return res.status(err.statusCode).json({ message: err.error, error: err.error });
        }
        else if (search_idx > -1) {
            const err = common.handleError({ statusCode: 500, message: 'Wallet Error', error: err_message }, 'Wallet', err_message, req.session.selectedNode);
            return res.status(err.statusCode).json({ message: err.error, error: err.error });
        }
        else if (body.error) {
            if ((body.code === 1 && body.error === 'context canceled') || (body.code === 14 && body.error === 'transport is closing')) {
                res.status(201).json('Successful');
            }
            else {
                const errMsg = (body.error && typeof body.error === 'object') ? JSON.stringify(body.error) : (body.error && typeof body.error === 'string') ? body.error : err_message;
                const err = common.handleError({ statusCode: 500, message: 'Wallet Error', error: errMsg }, 'Wallet', errMsg, req.session.selectedNode);
                return res.status(err.statusCode).json({ message: err.error, error: err.error });
            }
        }
        else {
            logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Wallet', msg: 'Wallet Unlocked/Initialized' });
            res.status(201).json('Successful');
        }
    }).catch((errRes) => {
        if ((errRes.error.code === 1 && errRes.error.error === 'context canceled') || (errRes.error.code === 14 && errRes.error.error === 'transport is closing')) {
            res.status(201).json('Successful');
        }
        else {
            const err = common.handleError(errRes, 'Wallet', err_message, req.session.selectedNode);
            return res.status(err.statusCode).json({ message: err.message, error: err.error });
        }
    });
};
export const updateSelNodeOptions = (req, res, next) => {
    const response = common.updateSelectedNodeOptions(req);
    res.status(response.status).json({ updateMessage: response.message });
};
export const getUTXOs = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Wallet', msg: 'Getting UTXOs..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.settings.lnServerUrl + '/v2/wallet/utxos';
    const maxConfs = common.parseQueryInt(req.query.max_confs);
    if (maxConfs === null) {
        return common.invalidQueryParam(res, 'max_confs', 'a non-negative integer');
    }
    if (common.isVersionCompatible(req.session.selectedNode.lnVersion, '0.14.0')) {
        options.form = JSON.stringify(maxConfs !== undefined ? { max_confs: maxConfs } : {});
    }
    else if (maxConfs !== undefined) {
        options.qs = { max_confs: maxConfs };
    }
    request.post(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Wallet', msg: 'UTXOs List Received', data: body });
        res.status(200).json(body.utxos ? body.utxos : []);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Wallet', 'List UTXOs Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const bumpFee = (req, res, next) => {
    const { txid, outputIndex, targetConf, satPerVByte } = req.body;
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Wallet', msg: 'Bumping Fee..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.settings.lnServerUrl + '/v2/wallet/bumpfee';
    options.form = {};
    options.form.outpoint = {
        txid_str: txid,
        output_index: outputIndex
    };
    if (targetConf) {
        options.form.target_conf = targetConf;
    }
    else if (satPerVByte) {
        options.form.sat_per_vbyte = satPerVByte;
    }
    options.form = JSON.stringify(options.form);
    request.post(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Wallet', msg: 'Fee Bumped', data: body });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Wallet', 'Bump Fee Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const labelTransaction = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Wallet', msg: 'Labelling Transaction..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.settings.lnServerUrl + '/v2/wallet/tx/label';
    options.form = JSON.stringify(req.body);
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Wallet', msg: 'Label Transaction Options', data: options.form });
    request.post(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Wallet', msg: 'Transaction Labelled', data: body });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Wallet', 'Label Transaction Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const leaseUTXO = (req, res, next) => {
    const { txid, outputIndex } = req.body;
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Wallet', msg: 'Leasing UTXO..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.settings.lnServerUrl + '/v2/wallet/utxos/lease';
    options.form = {};
    options.form.id = txid;
    options.form.outpoint = {
        txid_bytes: txid,
        output_index: outputIndex
    };
    options.form = JSON.stringify(options.form);
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Wallet', msg: 'UTXO Lease Options', data: options.form });
    request.post(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Wallet', msg: 'UTXO Leased', data: body });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Wallet', 'Lease UTXO Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const releaseUTXO = (req, res, next) => {
    const { txid, outputIndex } = req.body;
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Wallet', msg: 'Releasing UTXO..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.settings.lnServerUrl + '/v2/wallet/utxos/release';
    options.form = {};
    options.form.id = txid;
    options.form.outpoint = {
        txid_bytes: txid,
        output_index: outputIndex
    };
    options.form = JSON.stringify(options.form);
    request.post(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Wallet', msg: 'UTXO Released', data: body });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Wallet', 'Release UTXO Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
