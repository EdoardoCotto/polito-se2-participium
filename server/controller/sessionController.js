"use strict";
const userRepository = require('../repository/userRepository');

const express = require('express');
const passport = require('../utils/passport');

exports.login = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const user = await userRepository.getUser(username, password);
        
        req.login(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.status(200).json({
                id: user.id,
                username: user.username,
                name: user.name,
                surname: user.surname,
                email: user.email,
                type: user.type
            });
        });
    } catch (err) {
        // Gli errori dal repository vengono passati al middleware di gestione errori
        next(err);
    }
};

exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) {
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
            type: req.user.type
        });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
};