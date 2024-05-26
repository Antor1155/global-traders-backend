const customerCheckoutRouter = require("express").Router();

const checkout = require("./checkout");
const paymentCompleted = require("./paymentCompleted.js");

customerCheckoutRouter.use("/", checkout);
customerCheckoutRouter.use("/order-completed", paymentCompleted);

module.exports = customerCheckoutRouter;
