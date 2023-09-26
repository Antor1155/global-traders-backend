const { Schema, model, models } = require("mongoose");

const OrderSchema = new Schema({
    line_items: Object,
    name: String, 
    email: String, 
    phone: String, 
    city: String, 
    postal: String, 
    street: String, 
    country: String, 
    shipping: String,
    paid: Boolean,
    status: String,
    createdAt: {
        type: Date,
        default: Date.now,
    }
})

const Order = models?.Order || model("Order", OrderSchema)

module.exports = Order