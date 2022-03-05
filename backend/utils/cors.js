import { Logger } from './logger.js';
import { Common } from './common.js';
class CORS {
    constructor() {
        this.logger = Logger;
        this.common = Common;
    }
    mount(app) {
        this.logger.log({ selectedNode: this.common.initSelectedNode, level: 'INFO', fileName: 'CORS', msg: 'Setting up CORS..' });
        app.use((req, res, next) => {
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, filePath');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
            if (process.env.NODE_ENV === 'development') {
                res.setHeader('Access-Control-Allow-Credentials', 'true');
                res.setHeader('Access-Control-Allow-Origin', req.headers.origin ? req.headers.origin : req.headers.host ? req.headers.host : '');
            }
            next();
        });
        this.logger.log({ selectedNode: this.common.initSelectedNode, level: 'INFO', fileName: 'CORS', msg: 'CORS Set' });
        return app;
    }
    ;
}
export default new CORS;
