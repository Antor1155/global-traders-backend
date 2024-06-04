const { connectToDb } = require("../database");
const AddForm = require("../schema/addForm");

const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_KEY);

const wholesaleFormSubmit = async (req, res) => {
  const addForm = req.body;

  try {
    connectToDb();
    const newAddForm = new AddForm(addForm);

    await newAddForm.save();

    // sending emails to globaltradersww2@gmail.com to confirm order

    await resend.emails.send({
      from: "GT <wholesale@globaltraders-usa.com>",
      to: ["globaltradersww2@gmail.com"],
      subject: "Whole-sale form submitted !!",
      html: `<strong>Whole-sale customer query from!</strong> 
      </br>
       <h2>Wholesale query form submitted by <strong>${addForm?.name} </strong></h2> 
       </br> 
       <p><strong>Name: </strong> ${addForm?.name}</p> </br>
       <p><strong>Email: </strong> ${addForm?.email}</p> </br>
       <p><strong>Phone number: </strong> ${addForm?.phone}</p> </br>
       <p><strong>Devices: </strong> ${addForm?.devices}</p> </br>

    </br> `,
    });

    res.status(200).json(newAddForm);
  } catch (error) {
    res.status(500).json(error);
  }
};

module.exports = { wholesaleFormSubmit };
