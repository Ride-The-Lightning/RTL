const mongoose = require('mongoose');

const OfferSchema = new mongoose.Schema({
    alias: { type:String, required:true },
    invoice: { type:String, required:true }
});

module.exports = mongoose.model('Offer', OfferSchema);
