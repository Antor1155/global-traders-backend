const router = require("express").Router();
const customerCheckout = require("../checkout-customer/routes");
const addFormSubmit = require("./addFormSubmit");

router.use("/checkout-customer", customerCheckout);
router.use("/add-run-form-submit", addFormSubmit);

// form sumbit from addrun
// app.post("/add-run-form-submit");

module.exports = router;
