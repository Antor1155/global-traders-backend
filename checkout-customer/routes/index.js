const customerCheckoutRouter = require("express").Router();

const checkout = require("./checkout");

customerCheckoutRouter.use("/", checkout);

module.exports = customerCheckoutRouter;
