const express = require('express');
const controllers=require('./controllers');
const router = express.Router();
const passport = require("passport");

router.get('/google',passport.authenticate('google', { successRedirect: '/',scope: ['https://www.googleapis.com/auth/plus.login',
'https://www.googleapis.com/auth/plus.profile.emails.read']
}));

router.get('/google/nodemailer', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    return res.status(200);
  });

module.exports = router;