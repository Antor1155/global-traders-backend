const route = require("express").Router();
const { wholesaleFormSubmit } = require("../controllers/formSubmit");

route.post("/", wholesaleFormSubmit);

module.exports = route;
