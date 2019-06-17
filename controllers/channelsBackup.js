var request = require('request-promise');
var fs = require('fs');
var common = require('../common');
var logger = require('./logger');
var options = {};

exports.getBackup = (req, res, next) => {
  options = common.getOptions();
  let channel_backup_file = '';
  let message = '';
  if (req.params.channelPoint === 'ALL') {
    message = 'All Channels Backup Successful!';
    channel_backup_file = common.selectedNode.channel_backup_path + '/all-channels.bak';
    options.url = common.getSelLNDServerUrl() + '/channels/backup';
  } else {
    message = 'Channel ' + req.params.channelPoint + ' Backup Successful!';
    channel_backup_file = common.selectedNode.channel_backup_path + '/channel-' + req.params.channelPoint.replace(':', '-') + '.bak';
    let channelpoint = req.params.channelPoint.replace(':', '/');
    options.url = common.getSelLNDServerUrl() + '/channels/backup/' + channelpoint;
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
    logger.info('\r\nChannels Backup: 16: ' + new Date().toJSON().slice(0,19) + ': INFO: Channel Backup: ' + JSON.stringify(body));
    fs.writeFile(channel_backup_file, JSON.stringify(body), function(err) {
      if (err) {
        return res.status(500).json({ message: 'Channels Backup Failed!', error: err.error });
      } else {
        res.status(200).json({ message: message });
      }
    });
  })
  .catch(function (err) {
    logger.info('\r\nChannels Backup: 27: ' + new Date().toJSON().slice(0,19) + ': ERROR: Channel Backup: ' + JSON.stringify(err));
    return res.status(500).json({
      message: 'Channels Backup Failed!',
      error: err.error
    });
  });
};

exports.postBackupVerify = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNDServerUrl() + '/channels/backup/verify';
  let channel_verify_file = '';
  let message = '';
  let verify_backup = '';
  if (req.params.channelPoint === 'ALL') {
    message = 'All Channels Verify Successful!';
    channel_verify_file = common.selectedNode.channel_backup_path + '/all-channels.bak';
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
    message = 'Channel ' + req.params.channelPoint + ' Verify Successful!';
    channel_verify_file = common.selectedNode.channel_backup_path + '/channel-' + req.params.channelPoint.replace(':', '-') + '.bak';
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
      logger.info('\r\nChannels Backup Verify: 73: ' + new Date().toJSON().slice(0,19) + ': INFO: Channel Backup Verify: ' + JSON.stringify(body));
      res.status(201).json({ message: message });
    })
    .catch(function (err) {
      logger.info('\r\nChannels Backup Verify: 77: ' + new Date().toJSON().slice(0,19) + ': ERROR: Channel Backup Verify: ' + JSON.stringify(err));
      return res.status(404).json({
        message: 'Channel backup to Verify failed!',
        error: err.error
      });
    });
  }
};
