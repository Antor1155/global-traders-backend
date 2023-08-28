const mongoose = require("mongoose")

const uri = "mongodb+srv://socialengagementgroupmarketing:MX9LgCTbRFFbAriF@cluster0.jg8du4c.mongodb.net/?retryWrites=true&w=majority"

function connectToDb () {
    let state = mongoose.connection.readyState

    if (!state || state == 3){
        mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
    }
}

function disconnectDb(){
    let state = mongoose.connection.readyState

    if(state || state != 3){
        mongoose.disconnect()
    }
}


const db = mongoose.connection
db.on("error", console.error.bind(console, "mondb connection error"))

module.exports = {connectToDb, disconnectDb}
