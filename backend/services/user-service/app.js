const express = require('express');
const { attachResponseHelpers, setupErrorHandler } = require('@bajaj/shared');

const app = express();

// Middleware for security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(attachResponseHelpers);

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'user-service healthy', data: { service: 'user-service' } });
});

app.use('/api/user-management', require('./src/routes/user-management.routes'));
setupErrorHandler(app);

module.exports = app;
