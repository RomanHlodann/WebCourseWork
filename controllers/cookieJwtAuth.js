
const jwt = require("jsonwebtoken")

exports.cookieJwtAuth = (req, res, next) => {
    if(typeof req.cookies !== 'undefined'){
        const token = req.cookies.token

        try{
            const user = jwt.verify(token, process.env.ACCESS_TOKEN)
            req.user = user;
            next()
        } catch(err){
            console.log('hey')
            res.clearCookie("token")
            return res.redirect("/auth")
            
        }
    }
    else{
        next()
    }
}
