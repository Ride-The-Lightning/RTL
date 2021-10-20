import { Sequelize } from 'sequelize';
import { offer } from '../models/offers.model.js';
const rtlSequelize = new Sequelize('RTLStore', '', '', {
    storage: './database/db.sqlite',
    dialect: 'sqlite',
    logging: true
});
export const database = {
    Sequelize,
    rtlSequelize,
    offer: offer(rtlSequelize, Sequelize)
};
