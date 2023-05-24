const express = require("express");
const cors = require("cors");
const bodyparser = require('body-parser');
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

require("dotenv").config();

const APIroutes=require("./routes");
const routes = require("./authroutes");

const app = express();
app.use(cors());
app.use(bodyparser.json()); 
app.use(session({
  secret : "Kash_689056?//",
  resave : false,
  saveUninitialized : false

}))
app.use(passport.initialize());
app.use(passport.session());
require("./db")();

app.listen(process.env.PORT, () => {
  console.log("listening on port " + process.env.PORT);
});

app.use('/api',APIroutes);
app.use('/auth',routes);

app.get("/", async (req, res) => {
  // const result=await sendMail();
  res.send("Welcome to Gmail API with NodeJS");
});