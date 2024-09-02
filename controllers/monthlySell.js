const MonthlySell = require("../schema/monthlySell");

module.exports = {
  getMonthlySell: async (req, res) => {
    try {
      const amount = await MonthlySell.findOne({ name: "gt-sells" });
      res.json(amount);
    } catch (error) {
      console.error(error);
      res.status(400).json("could not get the data");
    }
  },

  setMonthlySell: async (req, res) => {
    try {
      const { name, amount } = req.body;

      let model = await MonthlySell.findOne({ name: name });

      if (!model) {
        model = new MonthlySell({ name: name });
      }

      model.amount = amount;

      await model.save();

      res.json("saved successfully");
    } catch (error) {
      console.error(error);
      res.status(400).json("couldn't set data");
    }
  },
};
