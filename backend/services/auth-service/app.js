const express = require('express');
const { attachResponseHelpers, setupErrorHandler } = require('@bajaj/shared');

const app = express();

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(attachResponseHelpers);

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'auth-service healthy', data: { service: 'auth-service' } });
});

app.use('/api/account', require('./src/routes/account.routes'));
setupErrorHandler(app);

module.exports = app;
