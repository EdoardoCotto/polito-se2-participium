const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('./utils/passport');
const { errorHandler } = require('./middlewares/errorMiddleware');
const { swaggerUi, swaggerSpec, swaggerUiOptions } = require('./swagger');

const sessionRoutes = require('./routes/sessionRoutes');
const userRoutes = require('./routes/userRoutes');
const reportRoutes = require('./routes/reportRoutes')
const constantRoutes = require('./routes/constantRoutes');
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

// Serve static files
app.use('/static', express.static('static'));

// Swagger API docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

app.use('/api', sessionRoutes);
app.use('/api', userRoutes);
app.use('/api', reportRoutes);
app.use('/api', constantRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3001;
if (require.main === module && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));
}
module.exports = app;