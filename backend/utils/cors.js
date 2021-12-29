import { Logger } from './logger.js';
class CORS {
    constructor() {
        this.logger = Logger;
    }
    mount(app) {
        this.logger.log({ selectedNode: null, level: 'DEBUG', fileName: 'CORS', msg: 'Setting up CORS.' });
        app.use((req, res, next) => {
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, filePath');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
            if (process.env.NODE_ENV === 'development') {
                res.setHeader('Access-Control-Allow-Credentials', true);
                res.setHeader('Access-Control-Allow-Origin', req.headers.origin ? req.headers.origin : req.headers.host ? req.headers.host : '');
            }
            next();
        });
        return app;
    }
    ;
}
export default new CORS;
