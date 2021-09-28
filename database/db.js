var datastore = require('nedb');
var logger = require('../controllers/shared/logger');
var database = new datastore('./database/database.db')
try {
    database.loadDatabase();
    logger.log({level: 'INFO', fileName: 'Database', msg: 'Database loaded'});
} catch(err) {
    logger.log({level: 'ERROR', fileName: 'Database', msg: 'failed to load the database', error: err}); 
}
module.exports = database
