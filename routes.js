const express = require('express');
const controllers=require('./controllers');
const router = express.Router();


router.post('/register',controllers.register);
router.post('/login',controllers.login);
router.get('/logout',controllers.logout);
router.get('/mail/send',controllers.sendMail);
router.get('/mail/read', controllers.readMail);

module.exports = router;