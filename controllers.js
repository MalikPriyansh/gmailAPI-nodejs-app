const axios = require("axios");
const nodemailer = require("nodemailer");
const CONSTANTS = require("./constants");
const { google } = require("googleapis");
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const mongoose = require("mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();

require("dotenv").config();

const userSchema = new mongoose.Schema({
    username : String,
    password : String,
    googleId : String,
    secret : String
});

const mailSchema = new mongoose.Schema({
    email : String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

const Email = new mongoose.model("Mails",mailSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:8000/auth/google/nodemailer",
  userProfileURL :  "https://googleapis.com/oauth2/v3/userinfo",
  passReqToCallback   : true
},
function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));

const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

async function register(req,res) {
    console.log(req.body);
    User.register({username : req.body.username}, req.body.password, (err,user)=>{
        if(err) {
            console.log(err);
            res.redirect("/register");
        }
        else {
            passport.authenticate("local")(req,res,()=>{
                return res.status(200).json({
                  status : 200,
                  messages : "User has been registered"
                })
            })
        }
    })
}



async function login(req,res) {
    const user = new User({
        username : req.body.username,
        password : req.body.password
    });

    req.login(user, (err)=>{
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req,res, ()=>{
              return res.status(200).json({
                status : 200,
                messages : "User has been loggedIn"
              })
            })
        };
    })
}

function logout(req,res){
    req.logout();
    res.redirect("/");
}

async function sendMail(req,res) {
  try {
    const accessToken = await oAuth2Client.getAccessToken();
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        ...CONSTANTS.auth,
        accessToken: accessToken,
      },
    });

    const mailOptions = {
      ...CONSTANTS.mailoptions,
      text: "The Gmail API with NodeJS works",
    };

    const result = await transport.sendMail(mailOptions);
    res.json(result);
  } catch (error) {
    console.log(error);
    res.json(error);
  }
}

async function readMail(req, res) {
    const accessToken = await oAuth2Client.getAccessToken();
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: `is:unread label:inbox `,
    });
    const messages = response.data.messages || [];
    const message = response.data.messages[0];
    const mail = await Email.findOne({email : message.id});
    if(mail){
      return res.status(200).json({
        status : 200,
        message : "Reply already has been given"
      })
    }
    const newEmail = new Email({
      email : message.id
    });
    const save = await newEmail.save();
    if(save){
      const email = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
      });
      console.log(email);
      const threadId = email.data.threadId;
      const replies = await gmail.users.messages.list({
        userId: 'me',
        q: `threadId:${threadId} -from:me`,
      });
      if (replies.data.resultSizeEstimate === 0 && email) {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              type: 'OAuth2',
              user: 'priyanshmalik332@gmail.com',
              clientId: process.env.CLIENT_ID,
              clientSecret: process.env.CLIENT_SECRET,
              refreshToken: process.env.REFRESH_TOKEN,
              accessToken: accessToken.token,
            },
          });
          const mailOptions = {
            from: 'priyanshmalik332@gmail.com',
            to: email.data.payload.headers.find(
              (header) => header.name === 'From'
            ).value,
            subject: 'Auto Reply'
          }
          gmail.users.messages.modify(
            {
              userId: 'me',
              id: email.data.id,
              resource: {
                addLabelIds: email.data.labelIds,
              },
            },
            (err, res) => {
              if (err) {
                console.error('Error applying label:', err);
                return;
              }
              console.log('Label applied to the email:', res);
            }
          );
        //   console.log(email.payload.headers);
          const result = await transporter.sendMail(mailOptions);
          return res.status(200).json({
            status : 200,
            message : "Reply has been sent",
            data : result
          })
      }
    }
    else{
      return res.status(500).json({
        status : 500,
        message : "Some Error Occured"
      })
    }
}     

module.exports = {
    register,
    login,
    logout,
    sendMail,
    readMail,
};  