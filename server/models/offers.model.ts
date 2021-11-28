export const Offer = (sequelize, Sequelize) => {
  const offerInstance = sequelize.define('Offers', {
    id: {
      type: Sequelize.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    offerInvoice: {
      type: Sequelize.STRING,
      allowNull: false
    }
  });
  return offerInstance;
};
