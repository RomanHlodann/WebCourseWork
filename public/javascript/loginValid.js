

const loginRegex = /^[a-zA-Z][a-zA-Z0-9]{4,11}$/
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{4,}$/
const emailRegex = /^[a-zA-Z][^\s@]+@[^\s@]+\.[^\s@]+$/

function checkInputLogin() {
    
    const login = document.getElementById('login')
    const password = document.getElementById('password')

    if(!checkLogin(login)){
        return false;
    }
    else if (!checkPassword(password)){
        return false;
    }
    return true;
}

function checkInputRegistration(){
    
    const login = document.getElementById('signUpLogin')
    const password = document.getElementById('signUpPwd')
    const confirmPassword = document.getElementById('signUpconfirm')
    const email = document.getElementById('signUpemail')


    if(!checkLogin(login)){
        return false;
    }
    else if (!checkPassword(password)){
        return false;
    }
    else if (!checkConfirmationOfPassword(password, confirmPassword))
        return false
    else if (!checkEmail(email))
        return false;
    return true;
}

function checkLogin( login ) {
    if(loginRegex.test(login.value)){
        return acceptibleInput(login)
    }  
    return wrongInput(login, 'Start with letter, don`t use specific char')
}

function checkPassword( password ) {
    if(passwordRegex.test(password.value))
        return acceptibleInput(password)
    return wrongInput(password, 'Use capital, small letter and number')
}

function checkEmail( email ) {
    if(emailRegex.test(email.value))
        return acceptibleInput(email)
    return wrongInput(email, 'Input correct email')
}

function checkConfirmationOfPassword(password, confirmed){
    if(password.value === confirmed.value)
        return acceptibleInput(confirmed)
    return wrongInput(confirmed, 'Passwards are different')
}

function acceptibleInput(elem) {
    elem.style.border = 'border: solid 2px #573b8a;';
    return true;
}

function wrongInput(elem, text) {
    elem.style.border = '3px solid red'
    elem.placeholder = text
    elem.value = ""
    return false;
}