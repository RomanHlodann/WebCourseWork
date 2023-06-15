
const pane = document.getElementById('pane')
const chat = document.getElementById('chat')
const inventory = document.getElementById('inventory')
const game = document.getElementById('game')
const yourCard = document.getElementById('yourCard')
const opponentCard = document.getElementById('opponentCard')
const countDown = document.getElementById('countDown')

const messageContainer = document.getElementById('message-container')
const message_form = document.getElementById('message-form')
const messageInput = document.getElementById('message-input')
const socket=io()

let roomId = 'none'

socket.emit("isUserInRoom", user_id)

const button = document.getElementById('playBttn')
button.addEventListener('click', function(){
    socket.emit("user_connected", user_id)
})

const messageTone = new Audio('../public_message-tone.mp3')

let usersInGame = []
let cardIsChosen = false;

function openGame(card_id){
    console.log(user_id + ' chose ' + card_id)
    if(cardIsChosen)
        return
    cardIsChosen = true
    socket.emit("openGame", user_id, roomId, card_id)
}

socket.on("displayGame", function(card_id){
    displayGame(card_id, true)
})

socket.on("openGameForOpponent", function(card_id){
    displayGame(card_id, false)
})

function displayGame(card_id, isItYourCard){
    console.log('displaying')
    game.style.opacity = '1';
    game.style.zIndex = '2';
    if(isItYourCard)
        yourCard.src = `/cards/${card_id > 99 ? card_id : '0' + card_id}.png`;
    else    
        opponentCard.src = `/cards/${card_id > 99 ? card_id : '0' + card_id}.png`
}

socket.on("closeGame", function(){
    console.log('closing')
    yourCard.src = ``
    opponentCard.src = ``
    game.style.opacity = '0';
    game.style.zIndex = '0';
    cardIsChosen = false;
})

socket.on("closeLobby", function(){
    pane.style.opacity = '1';
    chat.style.opacity = '0';
    inventory.style.opacity = '0';
    inventory.style.zIndex = '0';
    chat.style.zIndex = '0';
    pane.style.zIndex = '1';
})

socket.on("countDownTimer", function(){
    countDownTimer(4)
})
function countDownTimer(seconds){
    countDown.textContent = seconds;
  
    if (seconds > 0) {
        setTimeout(function() {
            countDownTimer(seconds - 1);
        }, 1000);
    }
}

socket.on('usercount', function(count){
    document.getElementById('count').innerHTML = count
})

socket.on('changeBackground', function(room){
    pane.style.opacity = '0';
    chat.style.opacity = '1';
    inventory.style.opacity = '1';
    inventory.style.zIndex = '1';
    chat.style.zIndex = '1';
    pane.style.zIndex = '1';
    roomId = room
})

message_form.addEventListener('submit', (e) => {
    e.preventDefault()
    sendMessage()
})

socket.on("displayMessagesFromLastSession", function(data){
    roomId = data.roomId
    addMessageToUI( data.user_id == user_id, data)
})

function sendMessage(){
    if (messageInput.value === '') return
    const data = {
        user_id: user_id,
        user_login: user_login,
        message: messageInput.value,
        dateTime: new Date(),
        action: 0,
        roomId: roomId
    }
    socket.emit('message', data)
    addMessageToUI(true, data)
    messageInput.value = ''
}

socket.on('chat-message', (data) => {
    messageTone.play()
    addMessageToUI(false, data)
})

function addMessageToUI(isOwnMessage, data) {
    clearFeedback()
    if(data.action != 0){
        displayGame(data.action, isOwnMessage)
        return
    }
    const element = `
        <li class="${isOwnMessage ? 'message-right' : 'message-left'}">
            <p class="message">
              ${data.message}
              <span>● ${moment(data.dateTime).fromNow()}</span>
            </p>
          </li>
          `
  
    messageContainer.innerHTML += element
    scrollToBottom()
}

function scrollToBottom() {
    messageContainer.scrollTo(0, messageContainer.scrollHeight)
}

messageInput.addEventListener('focus', (e) => {
    socket.emit('feedback', {
        user_id: user_id,
        roomId: roomId,
        feedback: `✍️ ${user_login} is typing a message`,
    })
})

messageInput.addEventListener('keypress', (e) => {
    socket.emit('feedback', {
        user_id: user_id,
        roomId: roomId,
        feedback: `✍️ ${user_login} is typing a message`,
    })
})
messageInput.addEventListener('blur', (e) => {
    socket.emit('feedback', {
        user_id: user_id,
        roomId: roomId,
        feedback: '',
    })
})
socket.on('feedback', (data) => {
    clearFeedback()
    const element = `
        <li class="message-feedback">
        <p class="feedback" id="feedback">${data.feedback}</p>
        </li>
    `  
    messageContainer.innerHTML += element
    scrollToBottom()
})

function clearFeedback() {
    document.querySelectorAll('li.message-feedback').forEach((element) => {
        element.parentNode.removeChild(element)
    })
}

function getUserByRoom(room, userIdSender){
    console.log('sender ' + userIdSender)
    const user = usersInGame.find((user) => user.roomId === room && user.user_id !== userIdSender);
    console.log(usersInGame)
    console.log('new ' + user.user_id)
    if (user) {
        return user;
    } else {
        throw new Error('User not found');
    }
}

socket.on("resultsOfGame", function(results){
    console.log("results")
    console.log(results);
    displayResultOfGame(results)
})

socket.on("opponentResultsOfGame", function(results){
    
    if(results.length > 1){
        console.log('results opponent ' + results[0].message)
        results[0].message = getNewMessage(results[0].message)
        results[1].message = getNewMessage(results[1].message)
    } else{
        results.message = getNewMessage(results.message)
        if (results.message == "You are blocked"){
            console.log(results.message)
            socket.emit("blockForOneMove", user_id)
        }
    }
    displayResultOfGame(results)
    console.log(results)
})

function getNewMessage(message){
    if(message == "You got")
        return "You lost"
    else if(message == "You lost")
        return "You got"
    else if(message.includes('You'))
        return message.replace('You', 'He')
    else if(message.includes('He is'))
        return message.replace('He is', 'You are')
    else 
        return message
}

const actionCard1 = document.getElementById('actionCard1')
const lostHeader = document.getElementById('lost')
const lostImage = document.getElementById('lostCard')

const actionCard2 = document.getElementById('actionCard2')
const gotHeader = document.getElementById('got')
const gotImage = document.getElementById('gotCard')

function displayResultOfGame(results){
    if(results.length > 1){
        actionCard1.style.opacity = '1';
        console.log(results[0])
        displayCards(actionCard1, lostHeader, lostImage, results[0])
        displayCards(actionCard2, gotHeader, gotImage, results[1])
    } else{
        displayCards(actionCard1, lostHeader, lostImage, results)
    }
}

function displayCards(actionCard, header, image, result){
    console.log('displaying... ' + actionCard)
    actionCard.style.opacity = '1'
    header.textContent = result.message
    if(result.card_id != null){
        image.src = `/cards/${result.card_id > 99 ? result.card_id : '0' + result.card_id}.png`
    }
    setTimeout(function(){
        actionCard.style.opacity = '0'
    }, 6000)
}