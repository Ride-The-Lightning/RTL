"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("./logger");
class CORS {
    constructor() {
        this.logger = logger_1.Logger;
    }
    mount(app) {
        this.logger.log({ level: 'DEBUG', fileName: 'CORS', msg: 'Setting up CORS.' });
        app.use((req, res, next) => {
            res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, filePath');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
            if (process.env.NODE_ENV === 'development') {
                res.setHeader('Access-Control-Allow-Origin', req.headers.origin ? req.headers.origin : '');
            }
            next();
        });
        return app;
    }
    ;
}
exports.default = new CORS;
