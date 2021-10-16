import { Sequelize } from 'sequelize';

const dbInterface = new Sequelize('offers', '', '', {
	storage: 'database.sqlite',
	dialect: 'sqlite',
	logging: true,
});

export default dbInterface;