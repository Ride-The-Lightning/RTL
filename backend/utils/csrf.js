import csurf from 'csurf/index.js';
import { Logger } from './logger.js';
import { Common } from './common.js';
class CSRF {
    constructor() {
        this.csrfProtection = csurf({ cookie: true });
        this.logger = Logger;
        this.common = Common;
    }
    mount(app) {
        this.logger.log({ selectedNode: this.common.initSelectedNode, level: 'INFO', fileName: 'CSRF', msg: 'Setting up CSRF..' });
        if (process.env.NODE_ENV !== 'development') {
            app.use((req, res, next) => this.csrfProtection(req, res, next));
        }
        return app;
    }
    ;
}
export default new CSRF;
