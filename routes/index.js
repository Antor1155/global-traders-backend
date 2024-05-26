const router = require("express").Router();
const customerCheckout = require("../checkout-customer/routes");

router.use("/checkout-customer", customerCheckout);

module.exports = router;
