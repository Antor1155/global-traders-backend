const { default: axios } = require("axios");
const { connectToDb } = require("../../database");
const Order = require("../../schema/order");
const SingleVariation = require("../../schema/singleVariation");

const endpoint_url = "https://api-m.sandbox.paypal.com";

exports.paypalCheckout = async (req, res) => {
  try {
    connectToDb();
    const {
      name,
      email,
      phone,
      city,
      postal,
      street,
      country,
      orders,
      shipping,
    } = req.body;

    const uniqueOrders = [...new Set(orders)];
    const productsInfo = await SingleVariation.find({ _id: uniqueOrders });

    // console.log(productsInfo);

    const totlaItems = [];
    let totalPrice = 0;

    // adding price for shipping
    if (shipping === "priority") {
      totlaItems.push({ shipping, price: 10, quantity: 1 });
    } else if (shipping === "express") {
      totlaItems.push({ shipping, price: 30, quantity: 1 });
    } else {
      totlaItems.push({ shipping, price: 0, quantity: 1 });
    }

    // const order = await Order.create({
    //   line_items,
    //   name,
    //   email,
    //   phone,
    //   city,
    //   postal,
    //   street,
    //   country,
    //   shipping,
    //   paid: false,
    //   status: "payment failed",
    // });

    const order = await exports.createOrder();
    console.log("order : ", order);
    res.json(order);
  } catch (error) {
    console.log("error in /checkout-customer ***", error);
    res.status(500).json(error);
  }
};

// use the orders api to create an order
exports.createOrder = async (totalprice = 100) => {
  // create accessToken using your clientID and clientSecret
  // for the full stack example, please see the Standard Integration guide
  // https://developer.paypal.com/docs/multiparty/checkout/standard/integrate/
  const { access_token } = await exports.generatePaypalAccessToken();

  console.log("access_token : ", access_token);

  return fetch(endpoint_url + "/v2/checkout/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`,
    },
    body: JSON.stringify({
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: "" + totalprice,
          },
          reference_id: "d9f80740-38f0-11e8-b467-0ed5f89f718b",
        },
      ],
      intent: "CAPTURE",
      payment_source: {
        paypal: {
          experience_context: {
            payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
            payment_method_selected: "PAYPAL",
            brand_name: "EXAMPLE INC",
            locale: "en-US",
            landing_page: "LOGIN",
            shipping_preference: "GET_FROM_FILE",
            user_action: "PAY_NOW",
            return_url: "https://example.com/returnUrl",
            cancel_url: "https://example.com/cancelUrl",
          },
        },
      },
    }),
  }).then((response) => response.json());
};

exports.generatePaypalAccessToken = async () => {
  const clientID =
    "AT_MXMU47GDc97KqUMcD6fE9TzdSSE1mdcnt6Rz0W9Y7_Tk37UDnQonu3SJY3iAefBIN2EdbCcOBSFVE";
  const clientSecret =
    "ENHMU9OHuu7fZoXJKUg6iDOpz_F2RxHCNa7MDi_t7nvb76MfnfDedbj1ZRfLT7xW4LeqaAP6SDa_-Bz1";

  const response = await axios({
    url: endpoint_url + "/v1/oauth2/token",
    method: "post",
    data: "grant_type=client_credentials",
    auth: {
      username: clientID,
      password: clientSecret,
    },
  });

  return response.data;
};
