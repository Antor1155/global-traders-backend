const { Schema, model, models } = require("mongoose");

const MonthlySellschema = new Schema(
  {
    name: String,
    amount: Number,
  },
  { timestamps: true }
);

const MonthlySell =
  models?.MonthlySell || model("MonthlySell", MonthlySellschema);

module.exports = MonthlySell;
