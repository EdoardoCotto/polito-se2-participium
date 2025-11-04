const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('./utils/passport');
const { swaggerUi, swaggerSpec } = require('./swagger');

const sessionRoutes = require('./routes/sessionRoutes');
const userRoutes = require('./routes/userRoutes');
const app = express();

// CORS configuration - allow requests from frontend
app.use(cors({
  origin: 'http://localhost:5173', // Vite default port
  credentials: true, // Allow cookies to be sent
}));

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
app.use('/api', userRoutes);

const PORT = 3001;
app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));
