"use strict";
const userRepository = require('../repository/userRepository');
const AppError = require('../errors/AppError');
const passport = require('../utils/passport');

exports.login = async (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json({ message: err.message });
            }
            return next(err);
        }

        if (!user) {
            return res.status(401).json({
                message: info?.message || 'Invalid username or password'
            });
        }

        req.login(user, (err) => {
            if (err) {
                if (err instanceof AppError) {
                    return res.status(err.statusCode).json({ message: err.message });
                }
                return next(err);
            }
            res.status(200).json({
                id: user.id,
                username: user.username,
                name: user.name,
                surname: user.surname,
                email: user.email,
                roles: user.roles,
                telegram_nickname: user.telegram_nickname,
                personal_photo_path: user.personal_photo_path,
                mail_notifications: user.mail_notifications
            });
        });
    })(req, res, next);
}

exports.logout = (req, res, next) => {
    const isAuth = req.isAuthenticated();
    if (!isAuth) {
        return res.status(401).json({ message: 'Not authenticated' });
    }
    req.logout((err) => {
        if (err) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json({ message: err.message });
            }
            return next(err);
        }
        res.status(200).json({ message: 'Logged out successfully' });
    });

};

exports.getCurrentSession = (req, res) => {
    if (req.isAuthenticated()) {
        res.status(200).json({
            id: req.user.id,
            username: req.user.username,
            name: req.user.name,
            surname: req.user.surname,
            email: req.user.email,
            roles: req.user.roles,
            telegram_nickname: req.user.telegram_nickname,
            personal_photo_path: req.user.personal_photo_path,
            mail_notifications: req.user.mail_notifications
        });
    } else {
        res.status(401).json({ message: 'Not authenticated' });
    }
};