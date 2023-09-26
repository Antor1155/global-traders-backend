const mongoose = require("mongoose")
require("dotenv").config()

const uri = process.env.MONGODB_URL

function connectToDb () {
    let state = mongoose.connection.readyState

    if (!state || state == 3){
        mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
    }
}

async function disconnectDb(){
    let state = mongoose.connection.readyState

    if(state || state != 3){
        await mongoose.disconnect()
    }
}


const db = mongoose.connection
db.on("error", console.error.bind(console, "mondb connection error"))

module.exports = {connectToDb, disconnectDb}
