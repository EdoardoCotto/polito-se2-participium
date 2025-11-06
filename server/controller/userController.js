const userRepository = require('../repository/userRepository')
const AppError = require('../errors/AppError')

exports.getUserById = async (req, res) => {
    try {
        const user = await userRepository.getUserById(req.params.id)
        res.status(200).json(user)
    }catch(err) {
        if (err instanceof AppError){
            res.status(err.statusCode).json({error: err.message})
        }
        else {
            res.status(500).json({error: 'Internal Server Error'})
        }
    }
}

exports.getUser = async (req, res) => {
    try {
        const user = await userRepository.getUser(req.params.id, req.params.password)
        res.status(200).json(user)
    }catch(err) {
        if (err instanceof AppError){
            res.status(err.statusCode).json({error: err.message})
        }
        else {
            res.status(500).json({error: 'Internal Server Error'})
        }
    }
}

exports.createUser = async (req, res) => {
    try {
        const created = await userRepository.createUser(req.body)
        res.status(201).json(created)
    }
    catch(err) {
        if (err instanceof AppError){
            res.status(err.statusCode).json({error: err.message})
        }
        else {
            res.status(500).json({error: 'Internal Server Error'})
        }
    }
}

exports.createUserIfAdmin = async (req, res) => {
    try {
        const created = await userRepository.createUserIfAdmin(req.params.user)
        res.status(201).json(created)
    }
    catch(err) {
        if (err instanceof AppError){
            res.status(err.statusCode).json({error: err.message})
        }
        else {
            res.status(500).json({error: 'Internal Server Error'})
        }
    }
}
