import * as fs from 'fs';
import { sep } from 'path';
import request from 'request-promise';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
let options = null;
const logger = Logger;
const common = Common;
function getFilesList(channelBackupPath, callback) {
    const files_list = [];
    let all_restore_exists = false;
    let response = { all_restore_exists: false, files: [] } || { message: '', error: {}, statusCode: 500 };
    fs.readdir(channelBackupPath + sep + 'restore', (err, files) => {
        if (err && err.code !== 'ENOENT' && err.errno !== -4058) {
            response = { message: 'Channels Restore List Failed!', error: err, statusCode: 500 };
        }
        if (files && files.length > 0) {
            files.forEach((file) => {
                if (!file.includes('.restored')) {
                    if (file.toLowerCase() === 'channel-all.bak' || file.toLowerCase() === 'backup-channel-all.bak') {
                        all_restore_exists = true;
                    }
                    else {
                        files_list.push({ channel_point: file.substring(8, file.length - 4).replace('-', ':') });
                    }
                }
            });
        }
        response = { all_restore_exists: all_restore_exists, files: files_list };
        callback(response);
    });
}
export const getBackup = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'ChannelBackup', msg: 'Getting Channel Backup..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    let channel_backup_file = '';
    let message = '';
    if (req.params.channelPoint === 'ALL') {
        channel_backup_file = req.session.selectedNode.channel_backup_path + sep + 'channel-all.bak';
        message = 'All Channels Backup Successful.';
        options.url = req.session.selectedNode.ln_server_url + '/v1/channels/backup';
    }
    else {
        channel_backup_file = req.session.selectedNode.channel_backup_path + sep + 'channel-' + req.params.channelPoint.replace(':', '-') + '.bak';
        message = 'Channel Backup Successful.';
        const channelpoint = req.params.channelPoint.replace(':', '/');
        options.url = req.session.selectedNode.ln_server_url + '/v1/channels/backup/' + channelpoint;
        const exists = fs.existsSync(channel_backup_file);
        if (exists) {
            fs.writeFile(channel_backup_file, '', () => { });
        }
        else {
            try {
                const createStream = fs.createWriteStream(channel_backup_file);
                createStream.end();
            }
            catch (errRes) {
                const err = common.handleError(errRes, 'ChannelsBackup', 'Backup Channels Error', req.session.selectedNode);
                return res.status(err.statusCode).json({ message: err.message, error: err.error });
            }
        }
    }
    request(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'ChannelsBackup', msg: 'Channel Backup Received', data: body });
        fs.writeFile(channel_backup_file, JSON.stringify(body), (errRes) => {
            if (errRes) {
                const err = common.handleError(errRes, 'ChannelsBackup', 'Backup Channels Error', req.session.selectedNode);
                return res.status(err.statusCode).json({ message: err.message, error: err.error });
            }
            else {
                logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'ChannelBackup', msg: 'Channel Backed up and Saved', data: body });
                res.status(200).json({ message: message });
            }
        });
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'ChannelsBackup', 'Backup Channels Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const postBackupVerify = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'ChannelBackup', msg: 'Verifying Channel Backup..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.ln_server_url + '/v1/channels/backup/verify';
    let channel_verify_file = '';
    let message = '';
    let verify_backup = '';
    if (req.params.channelPoint === 'ALL') {
        message = 'All Channels Verify Successful.';
        channel_verify_file = req.session.selectedNode.channel_backup_path + sep + 'channel-all.bak';
        const exists = fs.existsSync(channel_verify_file);
        if (exists) {
            verify_backup = fs.readFileSync(channel_verify_file, 'utf-8');
            if (verify_backup !== '') {
                const verify_backup_json = JSON.parse(verify_backup);
                delete verify_backup_json.single_chan_backups;
                options.form = JSON.stringify(verify_backup_json);
            }
            else {
                const errMsg = 'Channel backup to verify does not Exist.';
                const err = common.handleError({ statusCode: 404, message: 'Verify Channel Error', error: errMsg }, 'ChannelBackup', errMsg, req.session.selectedNode);
                return res.status(err.statusCode).json({ message: err.message, error: err.error });
            }
        }
        else {
            verify_backup = '';
            const errMsg = 'Channel backup to verify does not Exist.';
            const err = common.handleError({ statusCode: 404, message: 'Verify Channel Error', error: errMsg }, 'ChannelBackup', errMsg, req.session.selectedNode);
            return res.status(err.statusCode).json({ message: err.message, error: err.error });
        }
    }
    else {
        message = 'Channel Verify Successful.';
        channel_verify_file = req.session.selectedNode.channel_backup_path + sep + 'channel-' + req.params.channelPoint.replace(':', '-') + '.bak';
        const exists = fs.existsSync(channel_verify_file);
        if (exists) {
            verify_backup = fs.readFileSync(channel_verify_file, 'utf-8');
            options.form = JSON.stringify({ single_chan_backups: { chan_backups: [JSON.parse(verify_backup)] } });
        }
        else {
            verify_backup = '';
            const errMsg = 'Channel backup to verify does not Exist.';
            const err = common.handleError({ statusCode: 404, message: 'Verify Channel Error', error: errMsg }, 'ChannelBackup', errMsg, req.session.selectedNode);
            return res.status(err.statusCode).json({ message: err.message, error: err.error });
        }
    }
    if (verify_backup !== '') {
        request.post(options).then((body) => {
            logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'ChannelBackup', msg: 'Channel Backup Verified', data: body });
            res.status(201).json({ message: message });
        }).
            catch((errRes) => {
            const err = common.handleError(errRes, 'ChannelsBackup', 'Verify Channels Error', req.session.selectedNode);
            return res.status(err.statusCode).json({ message: err.message, error: err.error });
        });
    }
};
export const postRestore = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'ChannelBackup', msg: 'Restoring Channel Backup..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.ln_server_url + '/v1/channels/backup/restore';
    let channel_restore_file = '';
    let message = '';
    let restore_backup = '';
    if (req.params.channelPoint === 'ALL') {
        message = 'All Channels Restore Successful.';
        channel_restore_file = req.session.selectedNode.channel_backup_path + sep + 'restore' + sep;
        const exists = fs.existsSync(channel_restore_file + 'channel-all.bak');
        const downloaded_exists = fs.existsSync(channel_restore_file + 'backup-channel-all.bak');
        if (exists) {
            restore_backup = fs.readFileSync(channel_restore_file + 'channel-all.bak', 'utf-8');
            if (restore_backup !== '') {
                const restore_backup_json = JSON.parse(restore_backup);
                options.form = JSON.stringify({ multi_chan_backup: restore_backup_json.multi_chan_backup.multi_chan_backup });
            }
            else {
                const errMsg = 'Channel backup to restore does not Exist.';
                const err = common.handleError({ statusCode: 404, message: 'Restore Channel Error', error: errMsg }, 'ChannelBackup', errMsg, req.session.selectedNode);
                return res.status(err.statusCode).json({ message: err.message, error: err.error });
            }
        }
        else if (downloaded_exists) {
            restore_backup = fs.readFileSync(channel_restore_file + 'backup-channel-all.bak', 'utf-8');
            if (restore_backup !== '') {
                const restore_backup_json = JSON.parse(restore_backup);
                options.form = JSON.stringify({ multi_chan_backup: restore_backup_json.multi_chan_backup.multi_chan_backup });
            }
            else {
                const errMsg = 'Channel backup to restore does not Exist.';
                const err = common.handleError({ statusCode: 404, message: 'Restore Channel Error', error: errMsg }, 'ChannelBackup', errMsg, req.session.selectedNode);
                return res.status(err.statusCode).json({ message: err.message, error: err.error });
            }
        }
        else {
            restore_backup = '';
            const errMsg = 'Channel backup to restore does not Exist.';
            const err = common.handleError({ statusCode: 404, message: 'Restore Channel Error', error: errMsg }, 'ChannelBackup', errMsg, req.session.selectedNode);
            return res.status(err.statusCode).json({ message: err.message, error: err.error });
        }
    }
    else {
        message = 'Channel Restore Successful.';
        channel_restore_file = req.session.selectedNode.channel_backup_path + sep + 'restore' + sep + 'channel-' + req.params.channelPoint.replace(':', '-') + '.bak';
        const exists = fs.existsSync(channel_restore_file);
        if (exists) {
            restore_backup = fs.readFileSync(channel_restore_file, 'utf-8');
            options.form = JSON.stringify({ chan_backups: { chan_backups: [JSON.parse(restore_backup)] } });
        }
        else {
            restore_backup = '';
            const errMsg = 'Channel backup to restore does not Exist.';
            const err = common.handleError({ statusCode: 404, message: 'Restore Channel Error', error: errMsg }, 'ChannelBackup', errMsg, req.session.selectedNode);
            return res.status(err.statusCode).json({ message: err.message, error: err.error });
        }
    }
    if (restore_backup !== '') {
        request.post(options).then((body) => {
            logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'ChannelBackup', msg: 'Channel Restored', data: body });
            if (req.params.channelPoint === 'ALL') {
                channel_restore_file = channel_restore_file + 'channel-all.bak';
            }
            fs.rename(channel_restore_file, channel_restore_file + '.restored', () => {
                getFilesList(req.session.selectedNode.channel_backup_path, (getFilesListRes) => {
                    if (getFilesListRes.error) {
                        const errMsg = getFilesListRes.error;
                        const err = common.handleError({ statusCode: 500, message: 'Restore Channel Error', error: errMsg }, 'ChannelBackup', errMsg, req.session.selectedNode);
                        return res.status(err.statusCode).json({ message: err.error, list: getFilesListRes });
                    }
                    else {
                        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'ChannelBackup', msg: 'Channel Restored and Saved' });
                        return res.status(201).json({ message: message, list: getFilesListRes });
                    }
                });
            });
        }).
            catch((errRes) => {
            const err = common.handleError(errRes, 'ChannelsBackup', 'Restore Channel Error', req.session.selectedNode);
            return res.status(err.statusCode).json({ message: err.message, error: err.error });
        });
    }
};
export const getRestoreList = (req, res, next) => {
    getFilesList(req.session.selectedNode.channel_backup_path, (getFilesListRes) => {
        if (getFilesListRes.error) {
            return res.status(getFilesListRes.statusCode).json(getFilesListRes);
        }
        else {
            return res.status(200).json(getFilesListRes);
        }
    });
};
