import { Sequelize } from 'sequelize';
const sequelize = new Sequelize('BOLT12', '', '', {
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
