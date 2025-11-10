const userRepository = require('../repository/userRepository')
const AppError = require('../errors/AppError')
const { ALLOWED_ROLES } = require('../constants/roles')

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

exports.assignUserRole = async (req, res) => {
    try {
        const targetUserId = parseInt(req.params.id);
        const { type } = req.body || {};
        const updated = await userRepository.assignUserRole(req.user.id, targetUserId, type);
        res.status(200).json(updated);
    } catch (err){
        if (err instanceof AppError){
            res.status(err.statusCode).json({error: err.message})
        } else {
            res.status(500).json({error: 'Internal Server Error'})
        }
    }
}

exports.getAllowedRoles = async (_req, res) => {
    res.status(200).json({ roles: ALLOWED_ROLES });
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
        const created = await userRepository.createUserIfAdmin(req.user.id, req.body)
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
