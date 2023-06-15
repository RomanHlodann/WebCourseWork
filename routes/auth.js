
const express = require('express')
const authController = require('../controllers/auth');
const cookieController = require('../controllers/cookieJwtAuth')
const cookieParser = require('cookie-parser');
const router = express.Router();

router.use(cookieParser())

router.post('/' ,authController.auth )

router.get('/auth', (req,res) => {
    res.render('logIn.ejs')
})


module.exports = router;