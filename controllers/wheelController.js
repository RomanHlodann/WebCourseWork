
require('dotenv').config()

const mysql = require('mysql')
const jwt = require("jsonwebtoken")

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hunterXhunter'
})

exports.wheel = (req, res) => {  
    const user_id = req.user.user_id;
    const card_id = req.body.card_id.number;

    exports.updateCardsInDatabase(user_id, card_id)
    res.render('wheel.ejs', { user: req.user })
}



exports.updateCardsInDatabase = function updateCardsInDatabase(user_id, card_id){
    new Promise((resolve, reject) => {db.query(`SELECT count(*) FROM user_cards WHERE user_id = ${user_id} and card_id = ${card_id}`, (error, result) => {
        if(error)
            reject(error)
        else{
            resolve(result)
        }
    }) }) .then(result => {
        if( result[0]['count(*)'] == 0 ){
            let count_of_cards = 1;
            db.query('INSERT INTO user_cards SET ?', {user_id, card_id, count_of_cards}, (error) => {
                if(error)
                    console.log(error)
            })
        } else {
            db.query('UPDATE user_cards SET count_of_cards = count_of_cards + 1 WHERE user_id = ? and card_id = ?', [user_id, card_id], (error) => {
                if(error)
                    console.log(error)
            })
        }
    })
}

