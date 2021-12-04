/* eslint-disable no-console */
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sqlz from 'sequelize';
const { Sequelize } = sqlz;
import { Offer } from '../models/offers.model.js';
const rtlSequelize = new Sequelize('RTLStore', '', '', {
    storage: join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'database', 'rtl-db.sqlite'),
    dialect: 'sqlite',
    logging: console.log
});
export const Database = {
    Sequelize,
    rtlSequelize,
    offer: Offer(rtlSequelize, Sequelize)
};
