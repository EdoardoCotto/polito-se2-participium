"use strict";

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const userDao = require('../dao/userDao');

// Definizione della strategia di login
passport.use(new LocalStrategy(
  function (username, password, done) {
    userDao.getUser(username, password)
      .then(user => {
        if (!user)
          return done(null, false, { message: 'Invalid username or password' });
        
        // Check if user needs to confirm email
        if (user.error === 'unconfirmed')
          return done(null, false, { message: 'Please confirm your email address before logging in', email: user.email });
        
        return done(null, user);
      })
      .catch(err => done(err));
  })
);

// Serializzazione: salva l'id utente nella sessione
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserializzazione: ricostruisce l'oggetto utente dalla sessione
passport.deserializeUser((id, done) => {
  userDao.getUserById(id)
    .then(user => done(null, user))
    .catch(err => done(err, null));
});

module.exports = passport;
