const mongoose = require("mongoose");

const singleVariationSchema = new mongoose.Schema({
    name: String,
    storage: String,
    colorValue: String,
    colorName: String,
    price: Number,
    image: String,
})

const SingVariation =mongoose.models.SingVariation || mongoose.model("SingleVariation", singleVariationSchema)

module.exports = SingVariation