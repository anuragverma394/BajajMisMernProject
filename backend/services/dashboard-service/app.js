const express = require('express');
const { attachResponseHelpers, setupErrorHandler } = require('@bajaj/shared');

const app = express();

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(attachResponseHelpers);

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'dashboard-service healthy', data: { service: 'dashboard-service' } });
});

app.use('/api/dashboard', require('./src/routes/dashboard.routes'));
app.use('/api/main', require('./src/routes/main.routes'));
app.use('/api/bajaj-mis-service', require('./src/routes/bajaj-mis-service.routes'));
setupErrorHandler(app);

module.exports = app;
