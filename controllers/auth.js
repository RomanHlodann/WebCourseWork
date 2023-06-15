
require('dotenv').config()

const mysql = require('mysql')
const jwt = require('jsonwebtoken')



const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hunterXhunter'
})

auth = async (req, res) => {
    try{
    const { login, password, confirmedPassword, email, action } = req.body;

    const results = await findAllResultsOfQueryWithOneParamater('name', [login])

    if(action == 'login'){
        if(results.length == 0){
            return res.render('login', {message_login: 'Didn`t found that login'})
        }
        else if(results[0].password !== password){
            return res.render('login', {message_login: 'Password isn`t correct'})
        }
    }

    if(action == 'register'){
        if(results.length > 0)
            return res.render('login', {message_register: 'This login is already used'})
        
        const emailResults = await findAllResultsOfQueryWithOneParamater('email', [email])
        
        if(emailResults.length > 0){
            return res.render('login', {message_register: 'This email is already used'})
        }
        await insertUser(login, password, email)
        console.log('here')
    }

    const result = await getUserId(login) 
    console.log(login)

    let user_id = result[0].id
    const user = {user_id, login, password, email}
    const accessToken =jwt.sign(user, process.env.ACCESS_TOKEN)
    res.cookie("token", accessToken,{
        httpOnly: true
    })
    
    res.redirect('/')
    } catch (error){
        console.log('hey ' + error)
    }
            
}

findAllResultsOfQueryWithOneParamater = function findAllResultsOfQueryWithOneParamater( text, variable) {
    return new Promise ((resolve, reject) => {
        db.query('SELECT * FROM user WHERE ' + text + ' = ?', [variable], (error, results) => {
            if(error){
                reject(error)
            } else {
                resolve(results)
            }
        })
    })
}

function insertUser(login, password, email){
    return new Promise ((resolve, reject) => { db.query('INSERT INTO user SET ?', {name: login, password: password, email: email}, (error,results) =>{
            if(error)
                reject(error)
            else    
                resolve(results)
        })
    })
}

function getUserId(login){
    console.log(`SELECT id FROM user WHERE name= '${login}'`,)
    return new Promise((resolve, reject) => {db.query(`SELECT id FROM user WHERE name= '${login}'`, (error, result) => {
        if(error)
            reject(error)
        else{
            console.log(result)
            resolve(result)
        }
    }) })
}

module.exports = { auth, findAllResultsOfQueryWithOneParamater }