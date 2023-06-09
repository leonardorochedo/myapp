const jwt = require('jsonwebtoken')

const createUserToken = async(user ,req, res) => {

    // create a token, inseriando ele no user
    const token = jwt.sign({
        name: user.name,
        id: user.id
    }, "exposecret")

    // return token
    res.status(200).json({
        message: "Você está autenticado",
        token,
        userId: user.id
    })
}

module.exports = createUserToken