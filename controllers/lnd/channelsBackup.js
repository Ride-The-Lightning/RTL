var request = require('request-promise');
var fs = require('fs');
var common = require('../../common');
var logger = require('../logger');
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
          if (file === 'channel-all.bak') {
            all_restore_exists = true;
          } else {
            files_list.push({channel_point: file.substring(8, file.length - 4).replace('-', ':')});
          }
        }
      });
    }
    response =  {all_restore_exists: all_restore_exists, files: files_list};
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
    // message = 'All Channels Backup Successful at: ' + channel_backup_file + ' !';
    options.url = common.getSelLNServerUrl() + '/channels/backup';
  } else {
    channel_backup_file = common.selectedNode.channel_backup_path + common.path_separator + 'channel-' + req.params.channelPoint.replace(':', '-') + '.bak';
    message = 'Channel Backup Successful.';
    // message = 'Channel Backup Successful at: ' + channel_backup_file + ' !';
    let channelpoint = req.params.channelPoint.replace(':', '/');
    options.url = common.getSelLNServerUrl() + '/channels/backup/' + channelpoint;
    let exists = fs.existsSync(channel_backup_file);
    if (exists) {
      fs.writeFile(channel_backup_file, '', () => { });
    } else {
      try {
        var createStream = fs.createWriteStream(channel_backup_file);
        createStream.end();
      }
      catch (err) {
        return res.status(500).json({ message: 'Channels Backup Failed!', error: err });
      }
    }
  }
  request(options).then(function (body) {
    logger.info({fileName: 'Channels Backup', msg: 'Channel Backup: ' + JSON.stringify(body)});
    fs.writeFile(channel_backup_file, JSON.stringify(body), function(err) {
      if (err) {
        return res.status(500).json({ message: 'Channels Backup Failed!', error: err.error });
      } else {
        res.status(200).json({ message: message });
      }
    });
  })
  .catch(function (err) {
    logger.error({fileName: 'Channels Backup', lineNum: 44, msg: 'Channel Backup: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: 'Channels Backup Failed!',
      error: err.error
    });
  });
};

exports.postBackupVerify = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/channels/backup/verify';
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
    // message = 'Channel ' + req.params.channelPoint + ' Verify Successful!';
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
      logger.info({fileName: 'Channels Backup Verify', msg: 'Channel Backup Verify: ' + JSON.stringify(body)});
      res.status(201).json({ message: message });
    })
    .catch(function (err) {
      logger.error({fileName: 'Channels Backup Verify', lineNum: 93, msg: 'Channel Backup Verify: ' + JSON.stringify(err)});
      return res.status(404).json({
        message: 'Channel backup to Verify failed!',
        error: err.error
      });
    });
  }
};

exports.postRestore = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/channels/backup/restore';
  let channel_restore_file = '';
  let message = '';
  let restore_backup = '';
  if (req.params.channelPoint === 'ALL') {
    message = 'All Channels Restore Successful.';
    channel_restore_file = common.selectedNode.channel_backup_path + common.path_separator + 'restore' + common.path_separator + 'channel-all.bak';
    let exists = fs.existsSync(channel_restore_file);
    if (exists) {
      restore_backup = fs.readFileSync(channel_restore_file, 'utf-8');
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
    // message = 'Channel ' + req.params.channelPoint + ' Restore Successful!';
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
      logger.info({fileName: 'Channels Backup Restore', msg: 'Channel Backup Restore: ' + JSON.stringify(body)});
      fs.rename(channel_restore_file, channel_restore_file + '.restored', () => {
        getFilesList(getFilesListRes => {
          if (getFilesListRes.error) {
            return res.status(500).json({ message: 'Channel restore failed!', list: getFilesListRes });
          } else {
            return res.status(201).json({ message: message, list: getFilesListRes });
          }
        });      
      });
    })
    .catch(function (err) {
      logger.error({fileName: 'Channels Backup Restore', lineNum: 143, msg: 'Channel Backup Restore: ' + JSON.stringify(err)});
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
