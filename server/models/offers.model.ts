export const Offer = (sequelize, Sequelize) => {
  const offerInstance = sequelize.define('Offers', {
    id: {
      type: Sequelize.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    offerBolt12: {
      type: Sequelize.STRING,
      allowNull: false
    },
    amountmSat: {
      type: Sequelize.NUMBER,
      allowNull: false
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false
    },
    vendor: {
      type: Sequelize.STRING,
      allowNull: true
    },
    description: {
      type: Sequelize.STRING,
      allowNull: true
    }
  });
  return offerInstance;
};
