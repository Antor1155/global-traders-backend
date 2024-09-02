const express = require("express");
const { Resend } = require("resend");
const cors = require("cors");
const indexRouter = require("./routes/index");

const app = express();
app.use(cors());

// for firebase-function upload only
const functions = require("firebase-functions");

const { connectToDb, disconnectDb } = require("./database");
const ParentProduct = require("./schema/parentProduct");
const SingleVariation = require("./schema/singleVariation");
const Order = require("./schema/order");
const { connect, model } = require("mongoose");
const AvailableCatagories = require("./schema/availableCatagories");
const { error } = require("firebase-functions/logger");
const AddForm = require("./schema/addForm");

const stripe = require("stripe")(process.env.TEST_SECRET);
const endpointSecret = process.env.TEST_ENDPOINTSECRET;

const resend = new Resend(process.env.RESEND_KEY);

require("dotenv").config();

// using middle ware to access raw body
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(indexRouter);

connectToDb();

// when asked for all catagories
app.get("/catagory", async (req, res) => {
  connectToDb();

  const product = await ParentProduct.find();
  res.json(product);
});

//getting availableCatagories
app.get("/available-catagories", async (req, res) => {
  connectToDb();

  const availableCatagories = await AvailableCatagories.find();
  res.status(200).json(availableCatagories);
});

// making available catagories
app.get("/mka", async (req, res) => {
  try {
    connectToDb();
    // const  ctg = new AvailableCatagories({categories: ["iphone 8 plus", "iphone X","iphone XR","iphone XS","iphone 8"]})
    const ctg = new AvailableCatagories({ categories: [] });
    await ctg.save();

    res.status(200).json(ctg);
  } catch (error) {
    res.status(200).json(error);
  }
});

// when creating parent model
app.post("/catagory", async (req, res) => {
  connectToDb();

  const { modelName, description, images } = req.body;

  try {
    const newProduct = new ParentProduct({ modelName, description, images });
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: "can't find the product" });
  }
});

// edit catagory
app.patch("/catagory/:id", (req, res) => {
  connectToDb();
  const id = req.params.id;
  const update = req.body;

  ParentProduct.findByIdAndUpdate(id, update)
    .then((result) => res.status(200).json(result))
    .catch((error) => console.log(error));
});

//delete a catagory
app.delete("/catagory/:id", (req, res) => {
  connectToDb();
  const id = req.params.id;
  ParentProduct.findByIdAndDelete(id)
    .then((result) => res.status(200).json(result))
    .catch((error) => console.log(error));
});

// this part is for product
// get all products
app.get("/product", async (req, res) => {
  connectToDb();
  const allProduct = await SingleVariation.find();
  res.json(allProduct);
});

//get single product
app.get("/product/:id", async (req, res) => {
  try {
    connectToDb();
    const id = req.params.id;

    const product = await SingleVariation.findById(id);
    res.status(200).json(product);
  } catch {
    console.log("error in produt/:id get *** : ", error);
  }
});

// get all products of same parent catagory
app.get("/allSameParentProducts/:parentId", async (req, res) => {
  try {
    connectToDb();
    const id = req.params.parentId;

    const product = await SingleVariation.find({ parentCatagory: id });
    res.status(200).json(product);
  } catch {
    console.log("error in produt/:id get *** : ", error);
  }
});

//get products with search terms
app.get("/searchproducts", async (req, res) => {
  // we get ?search = value , so splid and get only value
  const query = req.query.search.split("=")[1];

  // for multiple values take splited with " " space
  const searchTerms = query.split(" ");

  try {
    connectToDb();

    const filterredWord = searchTerms
      .filter((word) => !/^iphone$/i.test(word))
      .join(" ");

    // console.log(filterredWord);

    const regex = new RegExp(filterredWord, "i");

    const result = await SingleVariation.find({
      $or: [{ productName: { $regex: regex } }],
    });

    // const result = [];

    // for (const term of searchTerms) {
    //   // Check if the term is 'iphone' (case-insensitive) and skip it if true
    //   if (/^iphone$/i.test(term)) {
    //     continue;
    //   }

    //   console.log(term);

    //   const regex = new RegExp(term, "i");

    //   const products = await SingleVariation.find({
    //     $or: [
    //       { productName: { $regex: regex } },
    //       // { storage: { $regex: regex } },
    //       // { condition: { $regex: regex } },
    //     ],
    //   });

    //   result.push(...products);
    // }

    res.status(200).json(result);
  } catch (error) {
    console.log("error in searchProducts", error);
    res.status(500).json("error in search products");
  }
});

//get first n products, ex: 12 with skip: 0
app.post("/products/:n/:skip", async (req, res) => {
  try {
    connectToDb();
    const n = req.params.n;
    const skip = req.params.skip;

    const { productName, storage, color, price, condition } = req.body;

    const searchQuery = {
      productName: productName.length
        ? { $in: productName }
        : { $exists: true },
      storage: storage.length ? { $in: storage } : { $exists: true },
      "color.name": color.length ? { $in: color } : { $exists: true },
      condition: condition.length ? { $in: condition } : { $exists: true },
      price: { $gte: price[0], $lte: price[1] },
    };

    // console.log("server query: ", searchQuery)

    const products = await SingleVariation.find(searchQuery)
      .skip(skip)
      .limit(n);
    // const products = await SingleVariation.find(searchQuery)

    if (products.length) {
      // console.log("products present")
      // console.log("products present : ", products)
    }
    res.json(products);
  } catch {
    (error) => console.log("error in get filtered product : ", error);
  }
});

//make a product
app.post("/product", async (req, res) => {
  try {
    connectToDb();

    let product = req.body;

    const newProduct = new SingleVariation(product);

    await newProduct.save();

    // add the product modelname to available catagories
    const act = await AvailableCatagories.find();

    const category = act[0]?.categories;
    const idCtg = act[0]._id;

    if (!category.includes(newProduct.productName)) {
      category.push(newProduct.productName);

      await AvailableCatagories.findByIdAndUpdate(idCtg, {
        categories: category,
      });
    }

    res.status(200).json(newProduct);
  } catch (error) {
    console.log("error in creating new product and category : ", error);
    res.send(500).json(error);
  }
});

// edit product
app.patch("/product/:id", (req, res) => {
  connectToDb();
  const id = req.params.id;
  const update = req.body;

  SingleVariation.findByIdAndUpdate(id, update)
    .then((result) => res.status(200).json(result))
    .catch((error) => console.log(error));
});

app.delete("/product/:id", (req, res) => {
  connectToDb();
  const id = req.params.id;

  SingleVariation.findByIdAndDelete(id)
    .then((result) => res.status(200).json(result))
    .catch((error) => console.log("product delete error: ***: ", error));
});

// get cart products form front end
app.post("/cart", async (req, res) => {
  try {
    connectToDb();
    const { ids } = req.body;
    const products = await SingleVariation.find({ _id: ids });
    res.status(200).json(products);
  } catch (error) {
    console.log(error);
    res.status(500).json("error form /cart *** ", error);
  }
});

//get all orders based on different catagory
app.get("/admin-orders/:status", async (req, res) => {
  const status = req.params.status;

  try {
    connectToDb();
    let orders = [];

    if (status.startsWith("byEmail") || status.startsWith("byOrderId")) {
      const [method, value] = status.split(":");
      if (method === "byEmail") {
        orders = await Order.find({ email: value }).sort({ updatedAt: -1 });
      } else {
        orders = [await Order.findById(value)];
      }
    } else {
      // get order from latest to old
      orders = await Order.find({ status }).sort({ updatedAt: -1 });
    }

    res.json(orders);
  } catch (error) {
    console.log("error in /admin-order ***", error);
  }
});

//get all orders based on data: today, this week and this month

app.get("/admin-orders-by-data", async (req, res) => {
  try {
    connectToDb();
    const orders = {
      today: [],
      thisWeek: [],
      thisMonth: [],
    };

    // Get orders created today
    const thisDay = new Date();
    thisDay.setHours(0, 0, 0, 0);

    const tDay = await Order.find({ createdAt: { $gte: thisDay } });

    // Get orders created this week
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay()); // Set to start of the week (Sunday)
    thisWeekStart.setHours(0, 0, 0, 0);

    const tWeek = await Order.find({ createdAt: { $gte: thisWeekStart } });

    // Get orders created this month
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const tMonth = await Order.find({
      createdAt: { $gte: monthStart, $lt: monthEnd },
    });

    orders.today = tDay;
    orders.thisWeek = tWeek;
    orders.thisMonth = tMonth;

    res.status(200).json(orders);
  } catch (error) {
    console.log("error in /admin-orders-by-data : ", error);
    res.status(500).json("error from /admin-order-details-by-data *** ", error);
  }
});

app.post("/update-order-status", async (req, res) => {
  const { orderId, status } = req.body;
  connectToDb();

  try {
    const order = await Order.findById(orderId);
    order.status = status;

    await order.save();

    const clientEmail = order?.email;

    // sending emails to globaltradersww2@gmail.com to confirm order
    await resend.emails.send({
      from: "GT <orders-update@globaltraders-usa.com>",
      to: [clientEmail],
      subject: `Order status changed to ${status}`,
      html: `<strong>Your order status updated!</strong> </br> <p> Your order with Order_Id:  <span style="color:blue">${order._id}</span>, status updated to <strong> ${status} </strong> </p> </br> <small> Thank you for staying with GlobalTraders </small>`,
    });

    res.send("success");
  } catch (error) {
    console.log("error in /update-order-status *** ", error);
  }
});

// get all order of a single client
app.get("/client-orders/:email", async (req, res) => {
  const email = req.params.email;

  try {
    connectToDb();

    const orders = await Order.find({ email, paid: true }).sort({
      updatedAt: -1,
    });
    res.json(orders);
  } catch (error) {
    console.log("error in client-orders page", error);
    res.json("Error: counldn't get orders");
  }
});

// addrun getting all product once
app.get("/all-products-single-variation", async (req, res) => {
  try {
    connectToDb();
    const availCatagoriesData = await AvailableCatagories.find();
    const { categories } = availCatagoriesData[0];

    const products = [];

    for (const productName of categories) {
      const product = await SingleVariation.findOne({ productName }).lean();
      if (product) {
        products.push(product);
      }
    }

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json(error);
  }
});

// warining sing to unwanted route
// app.use((req, res) => {
//     res.status(404).json({ error: "are you hacking ?" })
// })

// this part is for node js

// const port = process.env.PORT || 5001;
// app.listen(port, () => {
//   console.log("server is running on port, ", port);
// });

// this part is for firebase
exports.app = functions.https.onRequest(app);
