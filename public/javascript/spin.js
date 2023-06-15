const socket=io()

window.onload = function() {
    let isSpinning = false
    let wheel = document.querySelector('.wheel');
    let spinBtn = document.querySelector('.spinBtn')
    let lastSpinOption = 0;

    const typeS = [{number: 17, value: '../cards/017.png'}, {number: 87, value:'../cards/087.png'}, {number: 94, value:'../cards/094.png'}]
    const typeA = [{number: 1026, value:'../cards/1026.png'}, {number: 1010, value:'../cards/1010.png'}]
    const typeB = [{number: 1014, value:'../cards/1014.png'}, {number: 14, value:'../cards/014.png'}]
    const typeC = [{number: 1033, value:'../cards/1033.png'}, {number: 1027, value:'../cards/1027.png'}, {number: 1009, value:'../cards/1009.png'},
                    {number: 1008, value:'../cards/1008.png'}, {number: 1007, value:'../cards/1007.png'}]
    
    let chances = {
        "option1": 0.05,
        "option2": 0.1,
        "option3": 0.3,
        "option4": 0.55
    }

    socket.emit("isUserHasDoubleLuck", user_id)

    socket.on("doubleLuck", function(){
        chances = {
            "option1": 0.1,
            "option2": 0.2,
            "option3": 0.6,
            "option4": 0.1
        }
        setTimeout(function(){
            chances = {
                "option1": 0.05,
                "option2": 0.1,
                "option3": 0.3,
                "option4": 0.55
            }
        }, 600000)
    })

    let option1 = [22]
    let option2 = [292]
    let option3 = [156, 246, 337]
    let option4 = [337, 202, 111]

    let degrees;

    spinBtn.addEventListener('click', function(){

        if(!isSpinning){
            isSpinning = true;

            let randomNum = Math.random();
            let cumulativeProbability = 0;
            let selectedOption = null;

            for(let option in chances){
                cumulativeProbability += chances[option];
                if(randomNum <= cumulativeProbability){
                    selectedOption = option;
                    break;
                }
            }
            
            let card_id = getRandomCardId(selectedOption)
            
            let spinVariants = [ 1080, 3600, 7200, 10800 ]
            let optionSpin = Math.floor(getRandomBetween(1,4))
            if(lastSpinOption == optionSpin && optionSpin != 4)
                optionSpin++;
            wheel.style.transition = 'all 1s ease-out';
            wheel.style.transform = "rotate(" + (degrees + spinVariants[optionSpin - 1]) + "deg)";
            lastSpinOption = optionSpin

            fetch('/wheel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify({card_id: card_id})
            }) .then(response => {
                if(response.ok)
                    console.log('Request successful')
                else
                    console.log('Request failed')
            })

            setTimeout(function() {
                makeDropEffect(card_id)
                isSpinning = false;
              }, 1000);
        }
    })


    function getRandomBetween(first, second){
        return Math.random() * (second - first) + first;
    }

    function getRandomCardId(selectedOption){
        let option;
        switch(selectedOption){
            case "option1": degrees = Math.floor(getRandomBetween(3578,3622) - 3600); 
                        return card_id = typeS[ Math.floor(getRandomBetween(1, typeS.length) - 1) ]       

            case "option2": degrees = Math.floor(getRandomBetween(292-40,292) - 3600); 
                        return card_id = typeA[ Math.floor(getRandomBetween(1, typeA.length) - 1) ]
                
            case "option3": option = Math.floor(getRandomBetween(1, option3.length))
                degrees = Math.floor(getRandomBetween(option3[option - 1] - 40,option3[option - 1])); 
                    return card_id = typeB[ Math.floor(getRandomBetween(1, typeB.length) - 1) ]

            case "option4": option = Math.floor(getRandomBetween(1, option4.length))
                degrees = Math.floor(getRandomBetween(option4[option - 1] - 40,option4[option - 1])); 
                    return card_id = typeC[ Math.floor(getRandomBetween(1, typeC.length) - 1) ]
            }
    }

    function makeDropEffect(card_id){
        const elem = document.getElementById('getEffect')
        const screen = document.getElementById('wheelContainer')
        const image = document.getElementById('image')
        
        screen.classList.add("blur")
        elem.style.zIndex = "20"
        elem.style.opacity = "1"
        elem.style.transition = 'all 1s ease-out'
        image.src = card_id.value;
        
        screen.addEventListener('click', function(){
            elem.style.opacity = "0"
            elem.style.zIndex = "5"
            screen.classList.remove("blur")
        })
    }
}
