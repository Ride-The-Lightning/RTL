import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sqlz from 'sequelize';
const { Sequelize } = sqlz;
import { Logger } from '../utils/logger.js';
import { Offer } from '../models/offers.model.js';
export class DatabaseService {
    constructor() {
        this.logger = Logger;
        this.rtlConfigPassword = '';
        this.directoryName = dirname(fileURLToPath(import.meta.url));
        this.rtlSequelize = null;
        this.rtlDB = null;
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
