const { Schema, model, models } = require("mongoose");

const AvailableCatagoriesSchema = new Schema({
    categories: {
        type: [String],
        unique: true,
        required: true,
      }  
})

const AvailableCatagories = models?.AvailableCatagories || model("AvailableCatagories", AvailableCatagoriesSchema)

module.exports = AvailableCatagories