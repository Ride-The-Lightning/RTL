import csurf from 'csurf/index.js';
import { Logger } from './logger.js';
class CSRF {
    constructor() {
        this.csrfProtection = csurf({ cookie: true });
        this.logger = Logger;
    }
    mount(app) {
        this.logger.log({ selectedNode: null, level: 'DEBUG', fileName: 'CSRF', msg: 'Setting up CSRF.' });
        if (process.env.NODE_ENV !== 'development') {
            app.use((req, res, next) => this.csrfProtection(req, res, next));
        }
        return app;
    }
    ;
}
export default new CSRF;
