
const express = require('express')
const router = express.Router();
const cookieController = require('../controllers/cookieJwtAuth');
const wheelController = require('../controllers/wheelController')
const objects = require('../objects')
const cookieParser = require('cookie-parser');
const mysql = require('mysql')

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hunterXhunter'
})

router.use(cookieParser())

router.get('/', cookieController.cookieJwtAuth, (req, res) => {
    let inventory = [];
    const user_id = req.user.user_id;
    getInventory(user_id , function(result){
        if( result.length == 0)
            return res.render('play.ejs', { user: req.user })
        result.forEach(element => {
            inventory.push({ card_id : element.card_id, count_of_cards: element.count_of_cards})
        });
        res.render('play.ejs', { user: req.user, inventory: inventory })
    })
    
})

router.get('/wheel', cookieController.cookieJwtAuth, (req,res) => {
    res.render('wheel.ejs', { user: req.user })
})

router.get('/info', cookieController.cookieJwtAuth, (req,res) => {
    res.render('info.ejs', { user: req.user, cards: objects.cards })
})

router.post('/wheel', cookieController.cookieJwtAuth ,wheelController.wheel)

router.get('/logout', (req,res) => {
    res.clearCookie("token")
    return res.redirect("/auth")
})

router.get('/auth', (req,res) => {
    res.render('logIn.ejs')
})

module.exports = router;

function getInventory(user_id, callback){
    db.query(`SELECT card_id, count_of_cards FROM user_cards WHERE user_id = ${user_id} and inventory = 1`, function(err, results){
        if(err){
            console.log(err)
            return
        } else {
            return callback(results)
        }
    })
}