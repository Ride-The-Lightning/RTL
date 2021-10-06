"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const csurf = require("csurf");
const logger_1 = require("./logger");
class CSRF {
    constructor() {
        this.csrfProtection = csurf({ cookie: true });
        this.logger = logger_1.Logger;
    }
    mount(app) {
        this.logger.log({ level: 'DEBUG', fileName: 'CSRF', msg: 'Setting up CSRF.' });
        if (process.env.NODE_ENV !== 'development') {
            app.use((req, res, next) => this.csrfProtection(req, res, next));
        }
        return app;
    }
    ;
}
exports.default = new CSRF;
