import { Sequelize } from 'sequelize';
const sequelize = new Sequelize('RTLStore', '', '', {
    storage: 'database.sqlite',
    dialect: 'sqlite',
    logging: true,
});
import { offer } from '../models/offers.model.js';
export const database = {
    Sequelize,
    sequelize,
    offer: offer(sequelize, Sequelize)
};
