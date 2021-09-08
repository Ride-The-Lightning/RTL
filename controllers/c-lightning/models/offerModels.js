const mongoose = require("mongoose")

const offerRecord = new mongoose.Schema({
    alias: { type:String, required:true },
    invoice: { type:String, required:true }
})

const offerModel = mongoose.model('offerModel', offerRecord)

module.exports = offerModel