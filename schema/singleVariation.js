const mongoose = require("mongoose");

const singleVariationSchema = new mongoose.Schema({
    parentCatagory: {type: mongoose.Schema.Types.ObjectId},
    description: String,
    storage: String,
    color: Object,
    price: Number,
    originalPrice: Number,
    reviewScore: Number,
    peopleReviewed: Number,
    condition: String,
    image: String,
})

const SingVariation =mongoose.models.SingVariation || mongoose.model("SingleVariation", singleVariationSchema)

module.exports = SingVariation