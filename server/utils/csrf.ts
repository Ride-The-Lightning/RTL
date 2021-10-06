import * as csurf from 'csurf';
import { Application } from 'express';
import { Logger, LoggerService } from './logger';

class CSRF {

  public csrfProtection = csurf({ cookie: true });
  public logger: LoggerService = Logger;

  public mount(app: Application): Application {
    this.logger.log({ level: 'DEBUG', fileName: 'App', msg: 'Setting up CSRF.' });
    app.use((req, res, next) => {
      this.csrfProtection(req, res, next);
    });

    return app;
  };

}

export default new CSRF;
