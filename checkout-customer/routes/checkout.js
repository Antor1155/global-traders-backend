const route = require("express").Router();
const { paypalCheckout } = require("../controllers/checkout");

route.post("/", paypalCheckout);

module.exports = route;
