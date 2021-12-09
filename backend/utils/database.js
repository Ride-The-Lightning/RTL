/* eslint-disable no-console */
import * as fs from 'fs';
import { join, dirname, sep } from 'path';
import { fileURLToPath } from 'url';
import * as crypto from 'crypto';
import sqlz from 'sequelize';
const { Sequelize } = sqlz;
import { Logger } from '../utils/logger.js';
import { Common } from '../utils/common.js';
import { Offer } from '../models/offers.model.js';
export class DatabaseService {
    constructor() {
        this.hash = crypto.createHash('sha256');
        this.logger = Logger;
        this.common = Common;
        this.rtlConfigPassword = '';
        this.directoryName = dirname(fileURLToPath(import.meta.url));
        this.rtlSequelize = new Sequelize({
            database: 'RTLStore',
            username: '',
            password: this.rtlConfigPassword,
            storage: join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'database', 'rtl-db.sqlite'),
            dialect: 'sqlite',
            logging: messageToLog => this.logger.log({ level: 'DEBUG', fileName: 'DBLog', msg: messageToLog })
        });
        this.rtlDB = {
            Sequelize: this.rtlSequelize,
            offer: Offer(this.rtlSequelize, Sequelize)
        };
        let confFilePath = ((process.env.RTL_CONFIG_PATH) ? process.env.RTL_CONFIG_PATH : join(this.directoryName, '../..')) + sep + 'RTL-Config.json';
        const config = JSON.parse(fs.readFileSync(confFilePath, 'utf-8'));
        if ((+process.env.RTL_SSO === 0) || (typeof process.env.RTL_SSO === 'undefined' && +config.SSO.rtlSSO === 0)) {
            if ((process.env.APP_PASSWORD && process.env.APP_PASSWORD.trim() !== '') || (config.multiPass && config.multiPass !== '')) {
                this.rtlConfigPassword = this.hash.update(process.env.APP_PASSWORD).digest('hex');
            }
            else if (config.multiPassHashed && config.multiPassHashed !== '') {
                this.rtlConfigPassword = config.multiPassHashed;
            }
        }
    }
}
export const Database = new DatabaseService();
