import sqlz from 'sequelize';
const { Sequelize } = sqlz;
import { offer } from '../models/offers.model.js';
const rtlSequelize = new Sequelize('RTLStore', '', '', {
    storage: './database/db.sqlite',
    dialect: 'sqlite',
    logging: console.log
});
export const database = {
    Sequelize,
    rtlSequelize,
    offer: offer(rtlSequelize, Sequelize)
};
