
const express = require('express')
const app = express()
const path = require('path')
const dotenv = require('dotenv')
const http = require('http').createServer(app)
const io = require('./sockets')

io.init(http)

dotenv.config({ path: './env' })

http.listen(3000, function(){
    console.log('listening on 3000')
})


app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'public')))


app.use(express.urlencoded({ extended: false}))
app.use(express.json())

app.use('/', require('./routes/pages'))
app.use('/auth', require('./routes/auth'))
app.use('/book', require('./routes/book'))
