const mysql = require('mysql')
const wheelController = require('./controllers/wheelController')

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hunterXhunter'
})

class Card {
    constructor(type, id, defendedCards, description){
        this.type = type;
        this.id = id;
        this.defendedCards = defendedCards
        this.description = description
    }
}

const CardType = {
    ATTACK: "attack",
    DEFENSE: "defense",
    SPECIAL: "special"
  };

let cards = [ new Card (CardType.SPECIAL, 13, [], "Double luck for 10 minutes"),
            new Card (CardType.ATTACK, 14, [], "Blocks the opponent, it is impossible to be with him in the forehead anymore"),
            new Card (CardType.ATTACK, 17, [], "Restores all cards that were lost no more than 10 minutes ago"),
            new Card (CardType.DEFENSE, 87, ["13", "14", "17", "60", "88" ,"1007", "1008",], "Defense against any attacking card"),      
            new Card (CardType.ATTACK, 1007, [], "Steal a random enemy card"),
            new Card (CardType.ATTACK, 1008, [], "Exchange of random cards"),
            new Card (CardType.DEFENSE, 1009, ["1007"], "Protection against cards id=1007"),
            new Card (CardType.DEFENSE, 1010, ["1007", "1027", "1033"], "Protection against cards id=1007, 1027, 1033"),
            new Card (CardType.ATTACK, 1014, ["1007", "1027", "1033"], "Escape (possible against card 1007, 1027, 1033) with loss of one card"),
            new Card (CardType.DEFENSE, 60, [], "Return of a random card lost up to a month of time"),
            new Card (CardType.DEFENSE, 88, [], "Does not allow you to throw any card during one move.")]

function cardBattle(card_id_1, card_id_2){
    return new Promise ((resolve, reject) => {
        console.log( card_id_1 + " vs " + card_id_2 )
    const card1 = cards.find((card) => card.id == card_id_1)
    const card2 = cards.find((card) => card.id == card_id_2)
    if( card1.defendedCards.includes(card_id_2) ){
        if ( card2.defendedCards.includes(card_id_1) )
            reject(new Error('Noone won'))
        else
            resolve(true);
    }
    else if ( card2.defendedCards.includes(card_id_1) ){
        resolve(false);
    } else {
        reject(new Error('Everyone won'))
    }
    })
}

function applyEffect(card_id, owner_id, opponent_id, amIsendRequest) {
    console.log('card id = ' + card_id)
    return new Promise( (resolve, reject) => {
        switch(card_id){
            case "13": 
                    if(amIsendRequest)
                        resolve({ message :"You applied double luck", card_id: null })
                    else
                        resolve({ message :"Opponent applied double luck", card_id: null });
                        break;
            case "14": blockPerson(owner_id, opponent_id); 
                    if(amIsendRequest)
                        resolve({ message :"He is blocked", card_id: null })
                    else
                        resolve({ message :"You are blocked", card_id: null });
                        break;
            case "17": getBackAllCardsLostIn10minutes(owner_id); 
                    if(amIsendRequest)
                        resolve( {message : "All cards are back", card_id: null});
                    else
                        resolve( {message : "Opponent cards are back", card_id: null} );
                        break;
            case "60": getBackRandomCardLostInMonth(owner_id)
                        .then(result => {
                            if(result == 0)
                                resolve( {message : "No cards were found", card_id: null});
                            else
                                resolve( {message : "You returned ", card_id: result});
                        })
                        break;
            case "88": console.log('blocked')
                    if(amIsendRequest)
                            resolve({message : "He is blocked", card_id: null})
                        else    
                            resolve({message : "You are blocked", card_id: null})
                        break;
            case "1007": 
            getRandomCardId(opponent_id, function(card_id){
                wheelController.updateCardsInDatabase(owner_id, card_id)
                removeCardFromDb(opponent_id, card_id)
                if(amIsendRequest){
                    resolve( { message : "You got", card_id})
                }
                else
                    resolve( { message : "You lost", card_id})
                
            })
                break;
            case "1008": getRandomCardId(opponent_id, function(card_id){
                wheelController.updateCardsInDatabase(owner_id, card_id)
                removeCardFromDb(opponent_id, card_id)

                getRandomCardId(owner_id, function(lost_card_id){
                    wheelController.updateCardsInDatabase(opponent_id, lost_card_id)
                    removeCardFromDb(owner_id, lost_card_id)
                    
                    resolve( [{ message : "You got", card_id }, { message : "You lost", card_id: lost_card_id } ])
                })
            
            });  break;
            case "1014": getRandomCardId(owner_id, function(card_id){
                removeCardFromDb(owner_id, card_id)
                resolve( { message : "You escaped and lost ", card_id })
            }); break;
            default: resolve( { message : "Defended", card_id: null })
        }
    })
}

function blockPerson( userIdWhoWantToBlock, userIdToBlock){
    db.query(`INSERT INTO blocked_users
                SET ?`, {user_id: userIdWhoWantToBlock, blocked_user_id: userIdToBlock}, (error) => {
                    if(error){
                        console.log(error)
                    }
                })
}

function getBackAllCardsLostIn10minutes(user_id){
    const currentDate = new Date();
    currentDate.setMinutes(currentDate.getMinutes() - 10);

    const mySQLDateString = currentDate.toISOString().slice(0, 19).replace('T', ' ');
    getAllCardsLostForParticularTime(user_id, mySQLDateString)
        .then((result) => {
            result.forEach(element => {
                wheelController.updateCardsInDatabase(user_id, element.card_id)
            });
        }) .catch((error) => {
            console.log(error)
        })
    // db.query(`SELECT card_id FROM log_lost_cards WHERE user_id = ${user_id} and time > '${mySQLDateString}'`, (error, results) => {
    //     if(error){
    //         console.log(error)
    //         return;
    //     }
    //     console.log(results)
    //     results.forEach(element => {
    //         wheelController.updateCardsInDatabase(user_id, element.card_id)
    //     });
    // })
}

function getBackRandomCardLostInMonth(user_id){
    return new Promise((resolve, reject) => {
        const currentDate = new Date();
        currentDate.setMonth(currentDate.getMonth() - 1);

        const mySQLDateString = currentDate.toISOString().slice(0, 19).replace('T', ' ');
        getAllCardsLostForParticularTime(user_id, mySQLDateString)
            .then((result => {
                if(result.length == 0){
                    resolve(0)
                }
                const chooseCard = Math.floor(Math.random() * (result.length))
                resolve(result[chooseCard].card_id)
            })) .catch((error) =>{
                reject(error)
            })
    })
    
}

function getAllCardsLostForParticularTime(user_id, time){
    return new Promise ((resolve, reject) => {
        db.query(`SELECT card_id FROM log_lost_cards WHERE user_id = ${user_id} and time > '${time}'`, (error, results) => {
            if(error){
                reject(error)
            }
            console.log(results)
            resolve(results)
        })
    })
}

function getRandomCardId(user_id, callback){
    db.query(`SELECT card_id FROM user_cards WHERE user_id = ${user_id}`, (error, results) => {
        if(error){
            console.log(error)
            return;
        }
        let card = Math.floor(Math.random() * (results.length - 1))
        return callback(results[card].card_id)
    })
}

function removeCardFromDb(owner_id, card_id){    
    getCountOfCards(owner_id, card_id, function(result){
        if(result > 1){
            db.query('UPDATE user_cards SET count_of_cards = count_of_cards - 1 WHERE user_id = ? and card_id = ?', [owner_id, card_id], (error) => {
                if(error)
                    console.log(error)
                
            })
        } else if (result == 1){
            db.query('DELETE FROM user_cards WHERE user_id = ? and card_id = ?', [owner_id, card_id], (error) => {
                if(error)
                    console.log(error)
            })
        }
        logRemovedCard(owner_id, card_id)
    })
}

function logRemovedCard(owner_id, card_id){
    db.query(`INSERT INTO log_lost_cards SET ?`, {user_id: owner_id, card_id}, (error) => {
        if(error)
            console.log(error)
    })
}

function getCountOfCards(user_id, card_id, callback){
    db.query(`SELECT count_of_cards FROM user_cards WHERE user_id = ${user_id} and card_id = ${card_id}`, (error, result) => {
        if(error)
            reject(error)
        else if ( card_id != 0 && typeof result[0].count_of_cards !== 'undefined'){
            callback(result[0].count_of_cards)
        }
        })
}

module.exports = {cards, removeCardFromDb, applyEffect, cardBattle}