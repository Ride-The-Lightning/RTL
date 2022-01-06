import csurf from 'csurf/index.js';
import { Application } from 'express';
import { Logger, LoggerService } from './logger.js';
import { Common, CommonService } from './common.js';

class CSRF {

  public csrfProtection = csurf({ cookie: true });
  public logger: LoggerService = Logger;
  public common: CommonService = Common;

  public mount(app: Application): Application {
    this.logger.log({ selectedNode: this.common.initSelectedNode, level: 'INFO', fileName: 'CSRF', msg: 'Setting up CSRF..' });
    if (process.env.NODE_ENV !== 'development') {
      app.use((req, res, next) => this.csrfProtection(req, res, next));
    }
    this.logger.log({ selectedNode: this.common.initSelectedNode, level: 'INFO', fileName: 'CSRF', msg: 'CSRF Set' });
    return app;
  };

}

export default new CSRF;
