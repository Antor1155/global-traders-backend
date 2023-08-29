const mongoose = require("mongoose");

const singleVariationSchema = new mongoose.Schema({
    description: String,
    storage: String,
    colorValue: String,
    colorName: String,
    price: Number,
    originalPrice: Number,
    reviewScore: Number,
    peopleReviewed: Number,
    condition: String,
    image: String,
})

const SingVariation =mongoose.models.SingVariation || mongoose.model("SingleVariation", singleVariationSchema)

module.exports = SingVariation