
const mysql = require('mysql')
const auth = require('./controllers/auth')
const cards = require('./objects')
const wheelController = require('./controllers/wheelController')

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hunterXhunter'
})

let users = [];
let queue = []

function init(http){

    const io = require('socket.io')(http)

    io.on('connection', function(socket){
        console.log('a user connected')
        io.emit('usercount', queue.length)
        socket.on("user_connected", function(user_id){
            if(!queue.some(user => user.user_id === user_id)){
                queue.push({user_id, socket})
                io.emit('usercount', queue.length)
            }
            checkQueue()
        })

        socket.on("isUserInRoom", function(user_id){
            if(users.some(user => user.userId === user_id)){
                let user = users.find(user => user.userId === user_id)
                const roomId = user.roomId;
                user.userSocket = socket
                displayAllMessages(socket, roomId)
                socket.emit('changeBackground', roomId)
            }
        })

        socket.on("isUserHasDoubleLuck", function(user_id){
            db.query(`SELECT * FROM messages WHERE senderId = ${user_id} and action = 13`, (error, result) => {
                if(error){
                    console.log(error);
                    return
                }
                if(result.length > 0){
                    socket.emit("doubleLuck")
                    db.query(`DELETE FROM messages WHERE senderId = ${user_id} and action = 13`)
                }
            })
        })

        function displayAllMessages(socket, roomId){
            getMessages(roomId)
                .then( results => {
                    for( let i = 0; i < results.length; i++ ){
                        const row = results[i]
                        auth.findAllResultsOfQueryWithOneParamater('id', row.senderId)
                            .then(results => {
                                const data = {
                                    user_id: row.senderId,
                                    user_login: results[0].name,
                                    message: row.message,
                                    dateTime: row.date,
                                    action: row.action,
                                    roomId: roomId
                                }
                                socket.emit('displayMessagesFromLastSession', data)
                            }) .catch(error =>{
                                console.log(error)
                            })
                    }
                })
                .catch( error => {
                    console.log(error)
                })
        }

        socket.on("blockForOneMove", function(user_id){
            const blockedPerson = users.find((user) => user.userId == user_id)
            blockedPerson.blocked = 'true'
        })

        function getWinner(you, opponent){
            return new Promise((resolve, reject) => { 
                console.log(you.card_id)
                console.log(opponent.card_id)

                cards.removeCardFromDb(you.userId, you.card_id)
                cards.removeCardFromDb(opponent.userId, opponent.card_id)

                if(you.card_id == '1014' || opponent.card_id == '1014'){
                    setTimeout(function(){
                        disconnectLobby(you.userId)
                    }, 5000)
                }
                if( you.card_id == 0){
                    cards.applyEffect(opponent.card_id, opponent.userId, you.userId, false) 
                    .then((effect) =>{ 
                        opponent.userSocket.emit("resultsOfGame", effect) 
                        you.userSocket.emit("opponentResultsOfGame", effect) 
                    })
                    resolve(true)
                } else if ( opponent.card_id == 0 ){
                    cards.applyEffect(you.card_id, you.userId, opponent.userId, true)
                    .then((effect) =>{ 
                        you.userSocket.emit("resultsOfGame", effect)
                        opponent.userSocket.emit("opponentResultsOfGame", effect) 
                    })
                    resolve(true)
                }
                cards.cardBattle(you.card_id, opponent.card_id)
                    .then((isYouAreWinner) => {
                        console.log(isYouAreWinner)
                        let effect
                        if(isYouAreWinner){
                            cards.applyEffect(you.card_id, you.userId, opponent.userId, true)
                            .then((effect) => { 
                                you.userSocket.emit("resultsOfGame", effect)
                                opponent.userSocket.emit("opponentResultsOfGame", effect) 
                            })
                        } else{
                            effect = cards.applyEffect(opponent.card_id, opponent.userId, you.userId, false)
                            .then((effect) => {
                                opponent.userSocket.emit("resultsOfGame", effect)
                                you.userSocket.emit("opponentResultsOfGame", effect) 
                            })
                        }
                        resolve(true)
                    }) .catch((error) =>{
                        if(error.message === 'Noone won'){
                            console.log('Noone won')
                            you.userSocket.emit("resultsOfGame", {message: "Noone won", card_id: null })
                            opponent.userSocket.emit("opponentResultsOfGame", {message: "Noone won", card_id: null } ) 
                            resolve(true)
                        } else if( error.message === 'Everyone won' ){
                            console.log('Everyone won')
        
                            cards.applyEffect(you.card_id, you.userId, opponent.userId, true)
                            .then((effect) => {
                                you.userSocket.emit("resultsOfGame", effect)
                                opponent.userSocket.emit("opponentResultsOfGame", effect)
                                cards.applyEffect(opponent.card_id, opponent.userId, you.userId, false)
                                .then((effect) => {                                    
                                    setTimeout(function(){
                                        you.userSocket.emit("resultsOfGame", effect)
                                        opponent.userSocket.emit("opponentResultsOfGame", effect)
                                        resolve(true)
                                    }, 3000)
                                    
                                })
                            } )
                        }
                        
                    })
            })
        }

        function getMessages(roomId){
          return new Promise((resolve, reject) => {
              db.query(`SELECT * FROM messages WHERE roomId = '${roomId}'`, (error, results) => {
                  if(error)
                      reject(error)
                  else
                      resolve(results)
              })
          }) 
      } 

        socket.on('message', (data) => {
            if(typeof data.user_id == 'undefined'){
                return
            }
                
            addMessageToDatabase(data)
            const user = getUserByRoom(data.roomId, data.user_id)
            user.userSocket.emit('chat-message', data)
        })
        socket.on('feedback', (data) => {
            if( typeof data.user_id == 'undefined'){
                return
            }

            const user = getUserByRoom(data.roomId, data.user_id)
            user.userSocket.emit('feedback', data)
        })
        
        function addMessageToDatabase( data ){
            try{
                const senderId = data.user_id
                const message = data.message
                const action = data.action
                const roomId = getRoomByUserId(senderId)

                db.query('INSERT INTO messages SET ?', { roomId, senderId, message, action })
            } catch(e){
                console.log(e)
            }      
        }
        function getRoomByUserId(userId){  
            const user = users.find((user) => user.userId === userId);
            if (user) {
                return user.roomId;
            } else {
                throw new Error('User not found in any room');
            }
        }
        function getUserByRoom(room, userIdSender){
            const user = users.find((user) => user.roomId === room && user.userId !== userIdSender);
            if (user) {
                return user;
            } else {
                throw new Error('User not found');
            }
        }

        function checkQueue() {
            console.log('herre')
            if (queue.length >= 2) {
                isUserBlocked(queue[0].user_id, queue[1].user_id)
                    .then(result => {
                        console.log(result)
                        if(!result){
                            const user1 = queue.shift();
                            const user2 = queue.shift();
                            const roomId = generateRoomId();
                            joinRoom(user1, roomId)
                            joinRoom(user2, roomId)
                            io.emit('usercount', queue.length) 
                        }
                    }) .catch(error => {
                        console.log(error)
                    })
            }
        }

        function isUserBlocked(firstUser, secondUser){
            return new Promise ((resolve, reject) => db.query(`SELECT * FROM blocked_users WHERE user_id IN (${firstUser} , ${secondUser}) 
                AND blocked_user_id IN (${firstUser} , ${secondUser})`, (error, result) => {
                    if(error){
                        reject(error)
                    } else if(result.length > 0)
                        resolve(true);
                    resolve(false);
            }))
        }
    
        function joinRoom(user, roomId){
            const userSocket = user.socket;
            const userId = user.user_id;
            userSocket.emit('changeBackground', roomId)
            users.push({userId, userSocket, roomId, game: 0, card_id: 0, blocked: false})
        }
    
        function generateRoomId() {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            const length = 8;
            let roomId = '';
          
            for (let i = 0; i < length; i++) {
              const randomIndex = Math.floor(Math.random() * chars.length);
              roomId += chars[randomIndex];
            }
          
            return roomId;
        }

        socket.on("openGame", function(user_id, roomId, card_id){
            console.log(user_id)
            

            const user = users.find((user) => user.userId === user_id);
            if(user.blocked)
                return
            const opponent = getUserByRoom(roomId, user_id);
            if(user.game == 0){
                user.game = 1;
                user.userSocket.emit("countDownTimer")
                closeGame(user, opponent)
            }
            user.card_id = card_id;

            if(opponent.game == 0){
                opponent.game = 1;
                opponent.userSocket.emit("countDownTimer")
            }

            user.userSocket.emit("displayGame", card_id)
            opponent.userSocket.emit("openGameForOpponent", card_id)
            addMessageToDatabase({
                user_id: user_id,
                message: "",
                action: card_id
            })
        })

        function closeGame(user, opponent){
            setTimeout(function(){
                user.game = 0;
                opponent.game = 0;
                user.blocked = false;
                opponent.blocked = false;
                console.log(false);
                user.userSocket.emit("closeGame")
                opponent.userSocket.emit("closeGame")
                deleteActions(user, opponent)
                getWinner(user, opponent)
                    .then(result => {
                        user.card_id = 0;
                        opponent.card_id = 0;
                    })
            }, 4000)
        }

        function deleteActions(user, opponent){
            console.log('deleting...')         
            db.query(`DELETE FROM messages WHERE (senderId = ${user.userId} || ${opponent.userId}) and action not in (0, 13)`)
            console.log('Successfuly deleted')
        }

        socket.on("disconnectFromLobby", function(user_id){
            disconnectLobby(user_id)
        })

        function disconnectLobby(user_id){
            const user2 = users.find((user) => user.userId === user_id);
            const user1 = getUserByRoom(user2.roomId, user_id);
            users.pop(user1);
            users.pop(user2);
            console.log(users);
            console.log(user_id + ' us ' + user1.userId)
            db.query(`DELETE FROM messages WHERE senderId = ${user_id} || ${user1.userId}`)
            console.log('Successfuly deleted messages')
            user1.userSocket.emit("closeLobby")
            user2.userSocket.emit("closeLobby")
            socket.emit("closeLobby")
        }
        
        socket.on('disconnect', function(){
            console.log('user disconnected')
        })
        
    })
}

module.exports = { init }
