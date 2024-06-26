import atob from 'atob';
import request from 'request-promise';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
let options = null;
const logger = Logger;
const common = Common;
export const genSeed = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Wallet', msg: 'Generating Seed..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    if (req.params.passphrase) {
        options.url = req.session.selectedNode.settings.lnServerUrl + '/v1/genseed?aezeed_passphrase=' + Buffer.from(atob(req.params.passphrase)).toString('base64');
    }
    else {
        options.url = req.session.selectedNode.settings.lnServerUrl + '/v1/genseed';
    }
    request(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Wallet', msg: 'Seed Generated', data: body });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Wallet', 'Gen Seed Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const operateWallet = (req, res, next) => {
    const { wallet_password, aezeed_passphrase, cipher_seed_mnemonic } = req.body;
    let err_message = '';
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.method = 'POST';
    if (!req.params.operation || req.params.operation === 'unlockwallet') {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Wallet', msg: 'Unlocking Wallet..' });
        options.url = req.session.selectedNode.settings.lnServerUrl + '/v1/unlockwallet';
        options.form = JSON.stringify({
            wallet_password: Buffer.from(atob(wallet_password)).toString('base64')
        });
        err_message = 'Unlocking wallet failed! Verify that lnd is running and the wallet is locked!';
    }
    else {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Wallet', msg: 'Initializing Wallet..' });
        options.url = req.session.selectedNode.settings.lnServerUrl + '/v1/initwallet';
        if (aezeed_passphrase && aezeed_passphrase !== '') {
            options.form = JSON.stringify({
                wallet_password: Buffer.from(atob(wallet_password)).toString('base64'),
                cipher_seed_mnemonic: cipher_seed_mnemonic,
                aezeed_passphrase: Buffer.from(atob(aezeed_passphrase)).toString('base64')
            });
        }
        else {
            options.form = JSON.stringify({
                wallet_password: Buffer.from(atob(wallet_password)).toString('base64'),
                cipher_seed_mnemonic: cipher_seed_mnemonic
            });
        }
        err_message = 'Initializing wallet failed!';
    }
    request(options).then((body) => {
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
            logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Wallet', msg: 'Wallet Unlocked/Initialized', data: body });
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
    if (common.isVersionCompatible(req.session.selectedNode.lnVersion, '0.14.0')) {
        options.form = JSON.stringify({ max_confs: req.query.max_confs });
    }
    else {
        options.url = options.url + '?max_confs=' + req.query.max_confs;
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
    const { txid, outputIndex, targetConf, satPerByte } = req.body;
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
    else if (satPerByte) {
        options.form.sat_per_byte = satPerByte;
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
