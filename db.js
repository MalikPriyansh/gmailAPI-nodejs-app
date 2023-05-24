const mongoose = require("mongoose");

async function Conn(){
    const uri = "mongodb+srv://priyanshmalik332:pkyv8PCUvnHY9llF@cluster0.s1sverj.mongodb.net/?retryWrites=true&w=majority";
    try{
        mongoose.set('strictQuery', false);
        await mongoose.connect(uri,{
            useNewUrlParser: true, useUnifiedTopology: true 
        },await console.log("Mongoose is connected"));
    }
    catch(err){
        console.log(err);
        console.log("Mongoose is not connected");
    }
}

module.exports = Conn;