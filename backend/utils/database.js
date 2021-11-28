/* eslint-disable no-console */
import sqlz from 'sequelize';
const { Sequelize } = sqlz;
import { Offer } from '../models/offers.model.js';
const rtlSequelize = new Sequelize('RTLStore', '', '', {
    storage: './database/rtl-db.sqlite',
    dialect: 'sqlite',
    logging: console.log
});
export const Database = {
    Sequelize,
    rtlSequelize,
    offer: Offer(rtlSequelize, Sequelize)
};
