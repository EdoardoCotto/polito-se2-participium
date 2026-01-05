// Load environment variables
// Load from project root, not server directory
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('./utils/passport');
const { errorHandler } = require('./middlewares/errorMiddleware');
const { swaggerUi, swaggerSpec, swaggerUiOptions } = require('./swagger');
const {isMunicipal_public_relations_officer, isAdmin} = require("./middlewares/authMiddleware");

const sessionRoutes = require('./routes/sessionRoutes');
const userRoutes = require('./routes/userRoutes');
const reportRoutes = require('./routes/reportRoutes')
const constantRoutes = require('./routes/constantRoutes');
const commentRoutes = require('./routes/commentRoutes');
const telegramRoutes = require('./routes/telegramRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const telegramBotService = require('./services/telegramBotService');
const app = express();

// Disable X-Powered-By header for security
app.disable('x-powered-by');

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
app.use('/static', express.static(path.join(__dirname, 'static')));

// Swagger API docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

app.use('/api', sessionRoutes);
app.use('/api', userRoutes);
app.use('/api', reportRoutes);
app.use('/api', constantRoutes);
app.use('/api', commentRoutes);
app.use('/api', telegramRoutes);
app.use('/api', messageRoutes);
app.use('/api', notificationRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3001;
if (require.main === module && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
    console.log(`📚 Swagger docs available at http://localhost:${PORT}/api-docs`);
    
    // Initialize Telegram bot
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
    
    if (telegramToken) {
      telegramBotService.initializeBot(telegramToken, webhookUrl);
      console.log('✅ Telegram bot initialized');
    } else {
      console.log('⚠️ Telegram bot token not configured (TELEGRAM_BOT_TOKEN)');
    }
  });
}
module.exports = app;