const express = require("express")
const cors = require("cors")

const {connectToDb, disconnectDb} = require("./database")
const ParentProduct = require("./schema/parentProduct")
const  SingleVariation = require("./schema/singleVariation")

const app = express()
const port = process.env.PORT || 5000;

app.use(express.json())
app.use(cors())



// when asked for all catagories 
app.get("/allparentscatagories", async(req, res) =>{
    connectToDb()

    const product = await ParentProduct.find()
    res.json(product)

})

// when creating parent model 
app.post("/createparent", async(req, res)=>{
    connectToDb()

    const {modelName, description, images } = req.body;

    try{
        const newProduct = new ParentProduct({modelName, description, images})
        await newProduct.save()
        res.status(201).json(newProduct)

    }catch(error){
        res.status(500).json({error: "can't find the product"})
    }
})

// edit catagory 
app.patch("/updateparentcatagory/:id", (req, res)=>{
    connectToDb()
    const id = req.params.id
    const update = req.body;

    ParentProduct.findByIdAndUpdate(id, update)
    .then(result => res.status(200).json(result))
    .catch(error => console.log(error))
})

//delete a catagory

app.delete("/deleteSingleCatagory/:id", (req, res)=>{
    connectToDb()
    const id = req.params.id
    ParentProduct.findByIdAndDelete(id)
    .then(result => res.status(200).json(result))
    .catch(error => console.log(error))
})


// this part is for product 
// get all products
app.get("/allProducts", async (req, res)=>{
    connectToDb()
    const allProduct = await SingleVariation.find()
    res.json(allProduct)
})

//make a product
app.post("/addsingleproduct", async(req, res)=>{
    connectToDb()

    let product = req.body

    const newProduct = new SingleVariation(product)

    await newProduct.save()

    res.status(200).json(newProduct)
})


app.use((req, res) => {
    res.status(404).json({error: "are you hacking ?"})
})

app.listen(port, ()=>{
    console.log("server is running on port, ", port)
});