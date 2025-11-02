const express = require('express');
const session = require('express-session');
const passport = require('./utils/passport');
const { swaggerUi, swaggerSpec } = require('./swagger');

const sessionRoutes = require('./routes/sessionRoutes');
const app = express();

app.use(express.json());

app.use(session({
  secret: 'super-secret-key',
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

// 🔹 aggiungi questa riga
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api', sessionRoutes);

const PORT = 3001;
app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));
