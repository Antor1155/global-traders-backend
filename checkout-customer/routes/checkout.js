const route = require("express").Router();
const { paypalCheckout, capturePaymnet } = require("../controllers/checkout");

route.post("/", paypalCheckout);

route.post("/capture", capturePaymnet);

module.exports = route;
