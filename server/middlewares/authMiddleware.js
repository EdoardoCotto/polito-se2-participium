const NotFoundError = require('../errors/NotFoundError')
const ConflictError = require('../errors/ConflictError')
const BadRequestError = require('../errors/BadRequestError')
const UnauthorizedError = require('../errors/UnauthorizedError')

exports.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    } else {
        return next(new UnauthorizedError('User not authenticated'));
    }
}

exports.isAdmin = (req, res, next) => {
    if (req.isAuthenticated()) {
        if (req.user.type === 'admin') {
            return next();
        } else {
            return next(new UnauthorizedError('User is not admin'));
        }
    } else {
        return next(new UnauthorizedError('User not authenticated'));
    }
}