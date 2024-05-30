const { Schema, model, models } = require("mongoose");

const statusEnum = [
  "Processing",
  "Shipped",
  "Delivered",
  "Returned",
  "Refunded",
  "payment failed",
];
const paidWithEnum = ["Stripe", "Paypal"];
const shippingEnum = ["first-class", "priority", "express"];

const OrderSchema = new Schema(
  {
    line_items: Object,
    name: String,
    email: String,
    phone: String,
    city: String,
    postal: String,
    street: String,
    country: String,
    shipping: { type: String, enum: shippingEnum },
    paid: Boolean,
    status: { type: String, enum: statusEnum },
    paidWith: { type: String, enum: paidWithEnum },
    paypalId: String,
  },
  { timestamps: true }
);

OrderSchema.index({ paypalId: 1 });

const Order = models?.Order || model("Order", OrderSchema);

module.exports = Order;
