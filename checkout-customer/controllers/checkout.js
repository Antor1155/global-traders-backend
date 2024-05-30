const { default: axios } = require("axios");
const { connectToDb } = require("../../database");
const Order = require("../../schema/order");
const SingleVariation = require("../../schema/singleVariation");

const endpoint_url = "https://api-m.sandbox.paypal.com";

const paypalClientId =
  "AT_MXMU47GDc97KqUMcD6fE9TzdSSE1mdcnt6Rz0W9Y7_Tk37UDnQonu3SJY3iAefBIN2EdbCcOBSFVE";
const paypalClientSecret =
  "ENHMU9OHuu7fZoXJKUg6iDOpz_F2RxHCNa7MDi_t7nvb76MfnfDedbj1ZRfLT7xW4LeqaAP6SDa_-Bz1";

const testPaypalId =
  "AedV98QSLHo9mnixr3x1J2O5I0_P4ZN_lCVST3y12NYfswKZZrPx2jRfjwhyRWvr_Qe3Zpd1cSfpALFy";
const testPaypalSecret =
  "EI0A4akqfTgXsEZRRMZy1_Lge_74BS32w4_yuMMPWO7UZzROQmucyxCYvSoXEXXDpQHXPQAJytVOlht8";

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
    res.json(order);
  } catch (error) {
    console.log("error in /checkout-customer ***", error);
    res.status(500).json(error);
  }
};

// use the orders api to create an order
exports.createOrder = async (totalprice = 1) => {
  // create accessToken using your clientID and clientSecret
  // for the full stack example, please see the Standard Integration guide
  // https://developer.paypal.com/docs/multiparty/checkout/standard/integrate/
  const access_token = await exports.generatePaypalAccessToken();

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
  const clientID = testPaypalId;

  const clientSecret = testPaypalSecret;

  const response = await axios({
    url: endpoint_url + "/v1/oauth2/token",
    method: "post",
    data: "grant_type=client_credentials",
    auth: {
      username: clientID,
      password: clientSecret,
    },
  });

  return response?.data?.access_token;
};

exports.capturePaymnet = async (req, res) => {
  try {
    console.log("hitting the capture route");

    const orderId = req.body?.orderID;

    console.log("order id is : ", orderId);

    const accessToken = await exports.generatePaypalAccessToken();

    const url = `${endpoint_url}/v2/checkout/orders/${orderId}/capture`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
        // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
        // "PayPal-Mock-Response": '{"mock_application_codes": "INSTRUMENT_DECLINED"}'
        // "PayPal-Mock-Response": '{"mock_application_codes": "TRANSACTION_REFUSED"}'
        // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
      },
    });

    const responseData = await response.json();

    console.log("capture  payment response : *** ", responseData);

    // update order status to paid
    if (responseData?.status === "COMPLETED") {
      exports.updateOrder(responseData.id);
    }

    return res.json(responseData);
  } catch (error) {
    res.status(400).send(error);
  }
};

exports.updateOrder = async (paypalId) => {
  connectToDb();

  const order = await Order.find({ paypalId: paypalId });

  if (order.paid === false) {
    order.paid = true;
    order.status = "Processing";

    order.save();
  }
};
