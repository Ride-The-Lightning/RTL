var datastore = require('nedb');
var logger = require('../controllers/shared/logger');
var offerStore = new datastore('./database/offerStore.db')
try {
    offerStore.loadDatabase();
    logger.log({level: 'INFO', fileName: 'offerStore', msg: 'offerStore loaded'});
} catch(err) {
    logger.log({level: 'ERROR', fileName: 'offerStore', msg: 'failed to load the offerStore', error: err}); 
}
module.exports = offerStore
