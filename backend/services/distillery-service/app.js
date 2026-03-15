const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { attachResponseHelpers, setupErrorHandler } = require('@bajaj/shared');

dotenv.config();

const app = express();

// Middleware for security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(attachResponseHelpers);

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'distillery-service healthy', data: { service: 'distillery-service' } });
});

app.use('/api/distillery', require('./src/routes/distillery.routes'));
setupErrorHandler(app);

module.exports = app;
