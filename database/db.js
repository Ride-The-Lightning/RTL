const mongoose = require('mongoose');
const logger = require('../controllers/shared/logger');
const common = require('../routes/common');
const dbHost = common.dbHost ? common.dbHost : 'localhost';
const dbPort = common.dbPort ? common.dbPort : '27017';
const mongoURI = 'mongodb://' + dbHost + ':' + dbPort + '/RTL_DB'; // Should DB Host & Port be configurable???
const Offers = require('../models/offer.schema');

mongoose.connect(mongoURI).then(() => {
  logger.log({level: 'INFO', fileName: 'Database', msg: 'Connected to the database'});
}).catch((err) => {
  logger.log({level: 'ERROR', fileName: 'Database', msg: 'Connection failed', error: err}); 
});
