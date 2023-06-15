
window.onload = function() {

const cancelButton = document.getElementById("cancel")
console.log(cancelButton)
const infoAboutCard = document.getElementById('infoAboutCard')
console.log('info.js')

cancelButton.addEventListener('click', function(){
    infoAboutCard.style.opacity = '0'
    infoAboutCard.style.zIndex = '-1'
})
}

function displayCardInfo(card_id){ 
    console.log('display')              
    const imageEl = document.getElementById('cardForDesc')
    const desc = document.getElementById('descOfCard')
    const cardDescription = cards.find((card) => card.card_id == card_id).description;
    imageEl.src = `/cards/${card_id > 99 ? card_id : '0' + card_id}.png`
    desc.textContent = cardDescription
    infoAboutCard.style.opacity = '1'
    infoAboutCard.style.zIndex = '10'
}

