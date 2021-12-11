import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sqlz from 'sequelize';
const { Sequelize } = sqlz;
import { Logger, LoggerService } from '../utils/logger.js';
import { Offer } from '../models/offers.model.js';

export class DatabaseService {

  public logger: LoggerService = Logger;
  public rtlConfigPassword = '';
  public directoryName = dirname(fileURLToPath(import.meta.url));
  public rtlSequelize = null;
  public rtlDB = null;

  constructor() {
    this.rtlSequelize = new Sequelize({
      database: 'RTLStore',
      username: '',
      password: '',
      storage: join(this.directoryName, '..', '..', 'database', 'rtl-db.sqlite'),
      dialect: 'sqlite',
      logging: messageToLog => this.logger.log({ level: 'DEBUG', fileName: 'DBLog', msg: messageToLog })
    });
    this.rtlDB = {
      Sequelize: this.rtlSequelize,
      offer: Offer(this.rtlSequelize, Sequelize)
    };
  }
}

export const Database = new DatabaseService();
