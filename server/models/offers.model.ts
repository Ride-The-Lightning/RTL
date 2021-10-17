export const offer = (sequelize, Sequelize) => {
    const offerInstance = sequelize.define("offerCollection", {
        id : {
            type: Sequelize.UUIDV4,
			primaryKey: true,
			allowNull: false,
        },
        alias: {
            type: Sequelize.STRING,
			allowNull: false,
        },
        offerString: {
            type: Sequelize.STRING,
			allowNull: false,
        }
    });

    return offerInstance;
};