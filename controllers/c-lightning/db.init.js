const mongoose = require("mongoose")
require("./models/offerModels") //initiate models
mongoose.connect("mongodb://localhost/RTL") //<mongoProtocol>://localhost/<database>