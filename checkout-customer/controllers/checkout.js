const { default: axios } = require("axios");
const { connectToDb } = require("../../database");
const Order = require("../../schema/order");
const SingleVariation = require("../../schema/singleVariation");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_KEY);

const endpoint_url =
  process.env.ENVIRONMENT === "PRODUCTION"
    ? process.env.PAYPAL_BASE_URL
    : process.env.TEST_PAYPAL_BASE_URL;

const clientID =
  process.env.ENVIRONMENT === "PRODUCTION"
    ? process.env.PAYPAL_CLIENT_ID
    : process.env.TEST_PAYPAL_CLIENT_ID;

const clientSecret =
  process.env.ENVIRONMENT === "PRODUCTION"
    ? process.env.PAYPAL_SECRET
    : process.env.TEST_PAYPAL_SECRET;

exports.paypalCheckout = async (req, res) => {
  try {
    const { order, totalPrice } = await exports.makeOrderObjAndTotal({
      req,
      paidWith: "Paypal",
    });

    const paypalOrder = await exports.createPaypalOrder(totalPrice);

    const paypalId = paypalOrder?.id;

    if (paypalId) {
      order.paypalId = paypalId;

      await Order.create(order);

      res.json(paypalOrder);
    } else {
      return res.status(400).send("paypal error getting order id");
    }
  } catch (error) {
    console.log("error in /checkout-customer ***", error);
    return res.status(500).json(error);
  }
};

// use the orders api to create an order
exports.createPaypalOrder = async (totalprice) => {
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
    const orderId = req.body?.orderID;

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

    // console.log("capture  payment response : *** ", responseData);

    // update order status to paid
    if (responseData?.status === "COMPLETED") {
      exports.updateOrderPaid(responseData.id);
    }

    return res.json(responseData);
  } catch (error) {
    res.status(400).send(error);
  }
};

// **********************************************
// we already designed order Schema accroding to stripe and used in different places in UI,

// that's why designing order data like this way with line items
exports.makeOrderObjAndTotal = async ({ req, paidWith }) => {
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

  let line_items = [];

  for (const id of uniqueOrders) {
    const info = productsInfo.find((p) => p._id.toString() === id);
    const quantity = orders.filter((i) => i === id)?.length || 0;

    if (quantity > 0 && productsInfo) {
      line_items.push({
        quantity,
        price_data: {
          currency: "USD",
          unit_amount: info?.price * 100,
          product_data: {
            name: info?.productName,
            description: `${info?.color?.name} ${info?.condition} ${info?.storage}`,
            images: [info?.image],
            metadata: {
              productId: info?._id,
              quantity,
              totalPaid: info?.price * quantity,
            },
          },
        },
      });
    }
  }

  // adding price for shipping
  if (shipping === "priority") {
    line_items.push({
      quantity: 1,
      price_data: {
        currency: "USD",
        unit_amount: 10 * 100,
        product_data: {
          name: "priority shipping",
          metadata: {
            totalPaid: 10.5,
          },
        },
      },
    });
  } else if (shipping === "express") {
    line_items.push({
      quantity: 1,
      price_data: {
        currency: "USD",
        unit_amount: 30 * 100,
        product_data: {
          name: "express shipping",
          metadata: {
            totalPaid: 30,
          },
        },
      },
    });
  } else {
    line_items.push({
      quantity: 1,
      price_data: {
        currency: "USD",
        unit_amount: 0 * 100,
        product_data: {
          name: "First Class shipping",
          metadata: {
            totalPaid: 0,
          },
        },
      },
    });
  }

  const order = {
    line_items,
    name,
    email,
    phone,
    city,
    postal,
    street,
    country,
    shipping,
    paid: false,
    status: "payment failed",
    paidWith,
  };

  const totalPrice = line_items.reduce(
    (total, currentObj) =>
      total + currentObj?.price_data?.product_data?.metadata?.totalPaid || 0,
    0
  );

  return { order, totalPrice };
};

exports.updateOrderPaid = async (paypalId) => {
  connectToDb();

  const order = await Order.findOne({ paypalId: paypalId });

  if (order.paid === false) {
    order.paid = true;
    order.status = "Processing";

    await order.save();

    // sending emails to globaltradersww2@gmail.com to confirm order
    await resend.emails.send({
      from: "GT <orders@globaltraders-usa.com>",
      to: ["globaltradersww2@gmail.com"],
      subject: "New order on Global Traders",
      html: `<strong>New Orders!</strong> </br> <p>Order Id:  ${order._id}</p> </br> <h2>Go to Global Traders Admin page to see all orders</h2> </br> Link: https://globaltraders-usa.com/admin-secret/orders`,
    });
  }
};
