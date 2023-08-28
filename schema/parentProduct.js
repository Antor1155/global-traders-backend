const mongoose = require("mongoose")


const  parentProductSchema = new mongoose.Schema({
    modelName: String,
    description: String,
    variation: [{type: mongoose.Schema.Types.ObjectId, ref: "SingleVariation"}],
})

const ParentProduct =mongoose.models.ParentProduct || mongoose.model("ParentProduct", parentProductSchema)

module.exports = ParentProduct