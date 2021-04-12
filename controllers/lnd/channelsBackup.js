var request = require('request-promise');
var fs = require('fs');
var common = require('../../common');
var logger = require('../shared/logger');
var options = {};

function getFilesList(callback) {
  let files_list = [];
  let all_restore_exists = false;
  let response = {all_restore_exists: false, files: []};
  fs.readdir(common.selectedNode.channel_backup_path + common.path_separator + 'restore', function (err, files) {
    if (err && err.code !== 'ENOENT' && err.errno !== -4058) { response = { message: 'Channels Restore List Failed!', error: err } }
    if( files && files.length > 0) {
      files.forEach(file => {
        if (!file.includes('.restored')) {
          if (file.toLowerCase() === 'channel-all.bak' || file.toLowerCase() === 'backup-channel-all.bak') {
            all_restore_exists = true;
          } else {
            files_list.push({channel_point: file.substring(8, file.length - 4).replace('-', ':')});
          }
        }
      });
    }
    response = {all_restore_exists: all_restore_exists, files: files_list};
    callback(response);
  });
}

exports.getBackup = (req, res, next) => {
  options = common.getOptions();
  let channel_backup_file = '';
  let message = '';
  if (req.params.channelPoint === 'ALL') {
    channel_backup_file = common.selectedNode.channel_backup_path + common.path_separator + 'channel-all.bak';
    message = 'All Channels Backup Successful.';
    options.url = common.getSelLNServerUrl() + '/v1/channels/backup';
  } else {
    channel_backup_file = common.selectedNode.channel_backup_path + common.path_separator + 'channel-' + req.params.channelPoint.replace(':', '-') + '.bak';
    message = 'Channel Backup Successful.';
    let channelpoint = req.params.channelPoint.replace(':', '/');
    options.url = common.getSelLNServerUrl() + '/v1/channels/backup/' + channelpoint;
    let exists = fs.existsSync(channel_backup_file);
    if (exists) {
      fs.writeFile(channel_backup_file, '', () => { });
    } else {
      try {
        var createStream = fs.createWriteStream(channel_backup_file);
        createStream.end();
      }
      catch (errRes) {
        let err = JSON.parse(JSON.stringify(errRes));
        if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
          delete err.options.headers['Grpc-Metadata-macaroon'];
        }
        if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
          delete err.response.request.headers['Grpc-Metadata-macaroon'];
        }
        logger.error({fileName: 'ChannelsBackup', lineNum: 57, msg: 'Channels Backup Error: ' + JSON.stringify(err)});
        return res.status(500).json({ message: 'Channels Backup Failed!', error: err });
      }
    }
  }
  request(options).then(function (body) {
    logger.info({fileName: 'ChannelsBackup', msg: 'Channel Backup: ' + JSON.stringify(body)});
    fs.writeFile(channel_backup_file, JSON.stringify(body), function(errRes) {
      if (errRes) {
        let err = JSON.parse(JSON.stringify(errRes));
        if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
          delete err.options.headers['Grpc-Metadata-macaroon'];
        }
        if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
          delete err.response.request.headers['Grpc-Metadata-macaroon'];
        }
        logger.error({fileName: 'ChannelsBackup', lineNum: 72, msg: 'Channels Backup Error: ' + JSON.stringify(err)});
        return res.status(500).json({ message: 'Channels Backup Failed!', error: err.error });
      } else {
        res.status(200).json({ message: message });
      }
    });
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
      delete err.options.headers['Grpc-Metadata-macaroon'];
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
      delete err.response.request.headers['Grpc-Metadata-macaroon'];
    }
    logger.error({fileName: 'ChannelsBackup', lineNum: 86, msg: 'Channel Backup Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: 'Channels Backup Failed!',
      error: err.error
    });
  });
};

exports.postBackupVerify = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/channels/backup/verify';
  let channel_verify_file = '';
  let message = '';
  let verify_backup = '';
  if (req.params.channelPoint === 'ALL') {
    message = 'All Channels Verify Successful.';
    channel_verify_file = common.selectedNode.channel_backup_path + common.path_separator + 'channel-all.bak';
    let exists = fs.existsSync(channel_verify_file);
    if (exists) {
      verify_backup = fs.readFileSync(channel_verify_file, 'utf-8');
      if (verify_backup !== '') {
        verify_backup = JSON.parse(verify_backup);
        delete verify_backup.single_chan_backups;
        options.form = JSON.stringify(verify_backup);
      } else {
        res.status(404).json({ message: 'Channels backup to verify does not Exist!' });        
      }
    } else {
      verify_backup = '';
      res.status(404).json({ message: 'Channels backup to verify does not Exist!' });
    }
  } else {
    message = 'Channel Verify Successful.';
    channel_verify_file = common.selectedNode.channel_backup_path + common.path_separator + 'channel-' + req.params.channelPoint.replace(':', '-') + '.bak';
    let exists = fs.existsSync(channel_verify_file);
    if (exists) {
      verify_backup = fs.readFileSync(channel_verify_file, 'utf-8');
      options.form = JSON.stringify({ single_chan_backups: { chan_backups: [JSON.parse(verify_backup)] } });
    } else {
      verify_backup = '';
      res.status(404).json({ message: 'Channel backup to verify does not Exist!' });
    }
  }
  if (verify_backup !== '') {
    request.post(options).then(function (body) {
      logger.info({fileName: 'BackupVerify', msg: 'Channel Backup Verify: ' + JSON.stringify(body)});
      res.status(201).json({ message: message });
    })
    .catch(errRes => {
      let err = JSON.parse(JSON.stringify(errRes));
      if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
        delete err.options.headers['Grpc-Metadata-macaroon'];
      }
      if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
        delete err.response.request.headers['Grpc-Metadata-macaroon'];
      }
      logger.error({fileName: 'BackupVerify', lineNum: 141, msg: 'Channel Backup Verify Error: ' + JSON.stringify(err)});
      return res.status(404).json({
        message: 'Channel backup to Verify failed!',
        error: err.error
      });
    });
  }
};

exports.postRestore = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/channels/backup/restore';
  let channel_restore_file = '';
  let message = '';
  let restore_backup = '';
  if (req.params.channelPoint === 'ALL') {
    message = 'All Channels Restore Successful.';
    channel_restore_file = common.selectedNode.channel_backup_path + common.path_separator + 'restore' + common.path_separator;
    let exists = fs.existsSync(channel_restore_file + 'channel-all.bak');
    let downloaded_exists = fs.existsSync(channel_restore_file + 'backup-channel-all.bak');
    if (exists) {
      restore_backup = fs.readFileSync(channel_restore_file + 'channel-all.bak', 'utf-8');
      if (restore_backup !== '') {
        restore_backup = JSON.parse(restore_backup);
        options.form = JSON.stringify({multi_chan_backup: restore_backup.multi_chan_backup.multi_chan_backup});
      } else {
        res.status(404).json({ message: 'Channels backup to restore does not Exist!' });
      }
    } else if (downloaded_exists) {
      restore_backup = fs.readFileSync(channel_restore_file + 'backup-channel-all.bak', 'utf-8');
      if (restore_backup !== '') {
        restore_backup = JSON.parse(restore_backup);
        options.form = JSON.stringify({multi_chan_backup: restore_backup.multi_chan_backup.multi_chan_backup});
      } else {
        res.status(404).json({ message: 'Channels backup to restore does not Exist!' });
      }
    } else {
      restore_backup = '';
      res.status(404).json({ message: 'Channels backup to restore does not Exist!' });
    }
  } else {
    message = 'Channel Restore Successful.';
    channel_restore_file = common.selectedNode.channel_backup_path + common.path_separator + 'restore' + common.path_separator + 'channel-' + req.params.channelPoint.replace(':', '-') + '.bak';
    let exists = fs.existsSync(channel_restore_file);
    if (exists) {
      restore_backup = fs.readFileSync(channel_restore_file, 'utf-8');
      options.form = JSON.stringify({ chan_backups: { chan_backups: [JSON.parse(restore_backup)] } });
    } else {
      restore_backup = '';
      res.status(404).json({ message: 'Channel backup to restore does not Exist!' });
    }
  }
  if (restore_backup !== '') {
    request.post(options).then(function (body) {
      logger.info({fileName: 'ChannelRestore', msg: 'Channel Backup Restore: ' + JSON.stringify(body)});
      fs.rename(channel_restore_file, channel_restore_file + '.restored', () => {
        getFilesList(getFilesListRes => {
          if (getFilesListRes.error) {
            logger.error({fileName: 'ChannelRestore', lineNum: 190, msg: 'Channel Restore Error: ' + JSON.stringify(getFilesListRes.error)});
            return res.status(500).json({ message: 'Channel restore failed!', list: getFilesListRes });
          } else {
            return res.status(201).json({ message: message, list: getFilesListRes });
          }
        });      
      });
    })
    .catch(errRes => {
      let err = JSON.parse(JSON.stringify(errRes));
      if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
        delete err.options.headers['Grpc-Metadata-macaroon'];
      }
      if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
        delete err.response.request.headers['Grpc-Metadata-macaroon'];
      }
      logger.error({fileName: 'ChannelRestore', lineNum: 205, msg: 'Channel Restore Error: ' + JSON.stringify(err)});
      return res.status(404).json({
        message: 'Channel restore failed!',
        error: err.error.error
      });
    });
  }
};

exports.getRestoreList = (req, res, next) => {
  getFilesList(getFilesListRes => {
    if (getFilesListRes.error) {
      return res.status(500).json(getFilesListRes);
    } else {
      return res.status(200).json(getFilesListRes);
    }
  });
};
