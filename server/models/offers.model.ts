export const Offer = (sequelize, Sequelize) => {
  const offerInstance = sequelize.define('Offers', {
    id: {
      type: Sequelize.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    invoice: {
      type: Sequelize.STRING,
      allowNull: false
    },
    amount: {
      type: Sequelize.NUMBER,
      allowNull: false
    },
    description: {
      type: Sequelize.STRING,
      allowNull: false
    }
  });
  return offerInstance;
};
