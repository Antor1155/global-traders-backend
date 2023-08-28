const express = require("express")
const cors = require("cors")

const {connectToDb, disconnectDb} = require("./database")
const Product = require("./schema/product")

const app = express()
const port = process.env.PORT || 5000;

app.use(express.json())
app.use(cors())


app.get("/products", async(req, res) =>{
    connectToDb()

    const product = await Product.find()
    res.json(product)

    disconnectDb()
})

app.post("createproduct", async(req, res)=>{
    connectToDb()

    const {name, description } = req.body;

    try{
        const newProduct = new Product({name, description})
        await newProduct.save()
        res.status(201).json(newProduct)

    }catch(error){
        res.status(500).json({error: "can't find the product"})
    }
})



app.use((req, res) => {
    res.status(404).json({error: "are you hacking ?"})
})

app.listen(port, ()=>{
    console.log("server is running on port, ", port)
});