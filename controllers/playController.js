
const mysql = require('mysql')


const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hunterXhunter'
})

exports.play = (req, res) => {  

    res.render('play.ejs')
}