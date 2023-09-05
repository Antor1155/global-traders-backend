const mongoose = require("mongoose")


const  parentProductSchema = new mongoose.Schema({
    modelName: String,
    description: String,
    images: [String],
})

const ParentProduct =mongoose.models.ParentProduct || mongoose.model("ParentProduct", parentProductSchema)

module.exports = ParentProduct