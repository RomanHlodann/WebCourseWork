

window.onload = function(){
let currentLocation = 1;
let lastPage = 3;

const prevBtn = document.querySelector("#prev-btn");
const nextBtn = document.querySelector("#next-btn");
const checkBtn = document.querySelector("#check")

prevBtn.style.display = "none"
nextBtn.style.display = "none"

const book = document.querySelector("#book");
const textInPage = document.querySelector('.text');

const paper1 = document.querySelector("#p1");
const paper2 = document.querySelector("#p2");

const help = document.getElementById('help')

checkBtn.addEventListener("click", goNextPage)
prevBtn.addEventListener("click", goPrevPage)
nextBtn.addEventListener("click", goNextPage);


function openBook() {
    book.style.transform = "translateX(50%)";
    prevBtn.style.transform = "translateX(-180px)";
    nextBtn.style.transform = "translateX(180px)";
    textInPage.style.display = "none";
    prevBtn.style.display = ""
    nextBtn.style.display = ""
}

function closeBook(isAtBeginning) {
    if(isAtBeginning) {
        book.style.transform = "translateX(0%)";
        book.style.maxWidth = ""
    } else {
        book.style.transform = "translateX(100%)";
    }
    prevBtn.style.transform = "translateX(0px)";
    nextBtn.style.transform = "translateX(0px)";

    textInPage.style.display = "";
    prevBtn.style.display = "none"
    nextBtn.style.display = "none"
}

function goNextPage() {
    if(currentLocation < lastPage) {
        switch(currentLocation) {
            case 1:
                openBook();
                paper1.classList.add("flipped");
                paper1.style.zIndex = 1;
                break;
            case 2:
                paper2.classList.add("flipped");
                paper2.style.zIndex = 2;
                break;
            default:
                throw new Error("unkown state");
        }
        currentLocation++;
    }
}
function goPrevPage() {
    if(currentLocation > 1) {
        switch(currentLocation) {
            case 2:
                closeBook(true);
                paper1.classList.remove("flipped");
                paper1.style.zIndex = 3;
                break;
            case 3:
                paper2.classList.remove("flipped");
                paper2.style.zIndex = 2;
                break;
            case 4:
                openBook();
                paper3.classList.remove("flipped");
                paper3.style.zIndex = 1;
                break;
            default:
                throw new Error("unkown state");
        }

        currentLocation--;
    }
}

const helpForTapOnCard = document.getElementById('helpForTapOnCard')
const infoCardHelp = document.getElementById('infoCardHelp')

help.addEventListener('click', function(){
    if(isHelpTurnedOn){
        infoCardHelp.opacity = '1'
        helpForTapOnCard.opacity = '1'
        isHelpTurnedOn = true
    } else{
        infoCardHelp.opacity = '0'
        helpForTapOnCard.opacity = '0'
        isHelpTurnedOn = false
    }
})
}

let indexOfChosenCard;
let chosenCard;

function outputCardFromArrow(directArrow){
    console.log(cards)
    if((typeof indexOfChosenCard == 'undefined') || (cards.length <= indexOfChosenCard + directArrow) || (indexOfChosenCard + directArrow < 0))
        return
    outputChosenCard(parseInt(indexOfChosenCard) + directArrow)
}

function outputChosenCard(indexInCards){
    console.log(cards)
    console.log(indexInCards)
    const id = cards[indexInCards].cardId
    const path = `/cards/${id > 99 ? id : '0' + id}.png`;
    indexOfChosenCard = indexInCards;
    chosenCard = id;
    const count = document.getElementById('count')
    const secondPage = document.getElementById('secondPage')
    const paragraphCounter = document.getElementById('countOfCards')
    secondPage.style.opacity = '1'
    secondPage.src = path
    paragraphCounter.textContent = 'x' + cards[indexInCards].count_of_cards
    paragraphCounter.style.opacity = '1'
    count.style.opacity = '1'
}

let isHelpTurnedOn = false

function getHelp(){
    console.log('here ' + isHelpTurnedOn)
    if(!isHelpTurnedOn){
        infoCardHelp.style.opacity = '1'
        helpForTapOnCard.style.opacity = '1'
        isHelpTurnedOn = true
    } else{
        infoCardHelp.style.opacity = '0'
        helpForTapOnCard.style.opacity = '0'
        isHelpTurnedOn = false
    }
}

const button = document.getElementById('addButton')

button.addEventListener('click', function(){
    if(typeof chosenCard == 'undefined')
        return
    fetch('/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({card_id: chosenCard})
    }) .then(res => {
        console.log(res)
        return res.json()
    }) .then( data => {
            document.getElementById('messageAboutInventory').textContent = data.message
            let elem = document.getElementById(chosenCard + "mark")
            let top = Math.floor(indexOfChosenCard / 3) * 33 + 2
            let left = Math.floor(indexOfChosenCard % 3) * 32 + 25

            if(data.message === "Successfully added"){
                if( elem == null ){    
                    const newMark = document.createElement("img");
                    newMark.setAttribute("src", "/images/icons8-check.svg");
                    newMark.setAttribute("src", "/images/icons8-check.svg");
                    newMark.setAttribute("id", chosenCard + "mark");
                    newMark.style.position = "absolute"
                    newMark.style.top = top + "%"
                    newMark.style.left = left + "%"
                    newMark.style.width = "8%"

                    const parentElement = document.getElementById("parentMark");
                    parentElement.appendChild(newMark);
                } else{
                    elem.style.display = ''
                }
            }
            if(data.message === "Deleted from inventory"){
                if(elem !== null){    
                    elem.style.display = 'none'
                }
            }
        })
})



