const { Schema, model, models } = require("mongoose");

const AddFormSchema = new Schema(
  {
    name: String,
    email: String,
    phone: String,
    devices: String,
  },
  { timestamps: true }
);

const AddForm = models?.AddForm || model("AddForm", AddFormSchema);

module.exports = AddForm;
