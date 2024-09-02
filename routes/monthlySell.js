const {
  getMonthlySell,
  setMonthlySell,
} = require("../controllers/monthlySell");

const router = require("express").Router();

router.get("/", getMonthlySell);
router.post("/", setMonthlySell);

module.exports = router;
