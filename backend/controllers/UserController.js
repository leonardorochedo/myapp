const bcrypt = require('bcrypt')

const User = require('../models/User')
const Post = require('../models/Post')

// Helpers
const createUserToken = require('../helpers/create-user-token')
const getToken = require('../helpers/get-token')
const getUserByToken = require('../helpers/get-user-by-token')

module.exports = class UserController {

    static async register(req, res) {
        const {name, email, phone, password, confirmpassword} = req.body

        // Validations
        if(!name) {
            res.status(422).json({message: 'O nome é obrigatório'})
            return
        }

        if(!email) {
            res.status(422).json({message: 'O e-mail é obrigatório'})
            return
        }

        if(!phone) {
            res.status(422).json({message: 'O telefone é obrigatório'})
            return
        }

        if(!password) {
            res.status(422).json({message: 'A senha é obrigatória'})
            return
        }

        if(!confirmpassword) {
            res.status(422).json({message: 'A confirmação de senha é obrigatória'})
            return
        }

        // check if passwords match
        if(password !== confirmpassword) {
            res.status(422).json({message: 'As senhas não batem!'})
            return
        }

        // check if user exists
        console.log(email)
        const userExists = await User.findOne({where: {email: email}})

        if(userExists) {
            res.status(422).json({message: 'Por favor, utilize outro e-mail!'})
            return
        }

        // create a password encrypted
        const salt = await bcrypt.genSalt(12)
        const passwordHash = await bcrypt.hash(password, salt)

        // create user
        const user = new User({
            name,
            email,
            phone,
            password: passwordHash
        })

        try {
            const newUser = await user.save() // isert newUser
            
            // login user, incluindo um header de verificacao nele
            await createUserToken(newUser, req, res)
        } catch(err) {
            res.status(500).json({message: err})
        }
    }

    static async login(req, res) {
        const {email, password} = req.body

        // Validations
        if(!email) {
            res.status(422).json({message: 'O e-mail é obrigatório'})
            return
        }

        if(!password) {
            res.status(422).json({message: 'A senha é obrigatória'})
            return
        }

        // check if user exists
        const user = await User.findOne({where: {email: email}})

        if(!user) {
            res.status(404).json({message: 'Não há usuário cadastrado com esse email!'})
            return
        }

        // check if password match
        const passwordMatch = await bcrypt.compare(password, user.password)

        if(!passwordMatch) {
            res.status(422).json({message: 'Email ou senha inválidos!'})
            return
        }

        // login user
        await createUserToken(user, req, res)
    }

    static async editUser(req, res) {
        const id = req.params.id

        // check if user exist
        const token = getToken(req)
        const user = await getUserByToken(token)

        const {name, email, phone, password, confirmpassword} = req.body

        const userIsAuthenticated = user.id == id

        if(!userIsAuthenticated) {
            res.status(401).json({message: "Você não é autorizado para isso!"})
            return
        }

        // validations
        if(!name) {
            res.status(422).json({message: 'O nome é obrigatório'})
            return
        }

        user.name = name

        if(!email) {
            res.status(422).json({message: 'O e-mail é obrigatório'})
            return
        }

        const userExistis = await User.findOne({where: {email: email}}) // search for user in mongo

        // check if email has already taken
        if(user.email !== email && userExistis) {
            res.status(422).json({message: 'Por favor, utiliza outro e-mail!'})
            return
        }

        user.email = email

        if(!phone) {
            res.status(422).json({message: 'O telefone é obrigatório!'})
            return
        }

        user.phone = phone

        if(!password || !confirmpassword) {
            res.status(422).json({message: 'As senhas são obrigatórias!'})
            return
        }
        if(password != confirmpassword) {
            res.status(422).json({message: 'As senhas não conferem!'})
            return
        } else if(password === confirmpassword && password != null) {

            // creating password
            const salt = await bcrypt.genSalt(12)
            const passwordHash = await bcrypt.hash(password, salt)

            user.password = passwordHash
        }

        try {
            await User.update(user.dataValues, {where: {id: user.id}})

            res.status(200).json({
                message: "Usuário atualizado com sucesso!"
            })
        } catch (err) {
            res.status(500).json({message: err})
            return
        }

    }

    static async deleteUser(req, res) {
        const id = req.params.id

        // check if user exist
        const token = getToken(req)
        const user = await getUserByToken(token)

        const userIsAuthenticated = user.id == id

        if(!userIsAuthenticated) {
            res.status(401).json({message: "Você não é autorizado para isso!"})
            return
        }

        try {
            await Post.destroy({where: {UserId: user.id}})
            await User.destroy({where: {id: user.id}})

            res.status(202).json({message: 'Usuário deletado com sucesso!'})
        } catch(err) {
            res.status(500).json({message: err})
        }
    }

    static async getUserById(req, res) {
        const id = req.params.id

        const user = await User.findOne({where: {id: id}})

        if(!user) {
            res.status(404).json({message: 'Usuário não encontrado!'})
            return
        }

        res.status(200).json({ user })
    }

    static async getMyUser(req, res) {
        const token = getToken(req)
        const user = await getUserByToken(token)

        if(!user) {
            res.status(204).json({message: 'Você não é autorizado para acessar este perfil'})
            return
        }

        try {
            res.status(200).json({user})
        } catch (err) {
            res.status(500).json({message: err})
        }
    }
}