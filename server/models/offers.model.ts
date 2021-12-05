export const Offer = (sequelize, Sequelize) => {
  const offerInstance = sequelize.define('Offers', {
    id: {
      type: Sequelize.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    offer: {
      type: Sequelize.STRING,
      allowNull: false
    },
    amountmSat: {
      type: Sequelize.NUMBER,
      allowNull: false
    },
    label: {
      type: Sequelize.STRING,
      allowNull: false
    },
    issuer: {
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
