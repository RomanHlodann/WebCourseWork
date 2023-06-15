
const express = require('express')
const cookieController = require('../controllers/cookieJwtAuth')
const cookieParser = require('cookie-parser');
const router = express.Router();

const mysql = require('mysql')

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hunterXhunter'
})

router.use(cookieParser())

router.post('/', cookieController.cookieJwtAuth, (req, res) => {
    let check = 0;
    checkIfCardInInventory(req.user.user_id, req.body.card_id, function(result){
        console.log(result)
        check = result
        if(check == 1){
            changeCartToInventory(req.user.user_id, req.body.card_id, 0)
            res.json({message: "Deleted from inventory"})
            return
        } 
        let isAvailble = false
        checkForAvailbility(req.user.user_id, function(result){
            isAvailble = result
            if(isAvailble){
                changeCartToInventory(req.user.user_id, req.body.card_id, 1)
                res.json({message: "Successfully added"})
            } else {
                res.json({message: "Full inventory"})
            }
        })
        })
})

router.get('/', cookieController.cookieJwtAuth, (req,res) => {
    try{
        let result
        getArrayOfCards(req.user.user_id).then(results => {
            if(results.length == 0){
                res.render('book.ejs')
                return
            }
            result = results.map((row) => ({
                    cardId: row.card_id,
                    countOfCards: row.count_of_cards,
                    inventory: row.inventory
                }));
            res.render('book.ejs', {result: result})
        })

        
    } catch (error){
        console.log(error)
    }
    
})

function changeCartToInventory(user_id, card_id, result){
    db.query(`
        UPDATE user_cards
        SET inventory = ${result}
        WHERE user_id = ${user_id} and card_id = ${card_id}
        `)
}



function checkForAvailbility(user_id, callback){
    db.query(` SELECT * FROM user_cards WHERE inventory = 1 and user_id = ${user_id}`, function(err, results){
        if(err){
            console.log(err)
            return
        } else {
            if(results.length >= 4 )
                return callback(false)
            return callback(true)
        }
    })
}

function checkIfCardInInventory(user_id, card_id, callback){
    db.query(`
        SELECT inventory FROM user_cards
        WHERE user_id = ${user_id} and card_id = ${card_id}
        `, function(err, results){
            if(err){
                console.log(err)
                return
            }
            return callback(results[0].inventory)
        })
}

 function getArrayOfCards(user_id){
    return new Promise((resolve, reject) => {
        db.query(`SELECT card_id, count_of_cards, inventory FROM user_cards WHERE user_id = ${user_id}`, (error, results) => {
            if(error)
                reject(error)
            else
                resolve(results)
        })
    }) 
} 

module.exports = router;