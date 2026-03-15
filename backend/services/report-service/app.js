const express = require('express');
const { attachResponseHelpers, setupErrorHandler } = require('@bajaj/shared');

const app = express();

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(attachResponseHelpers);

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'report-service healthy', data: { service: 'report-service' } });
});

app.use('/api/report', require('./src/routes/report.routes'));
app.use('/api/report-new', require('./src/routes/report-new.routes'));
app.use('/api/new-report', require('./src/routes/new-report.routes'));
app.use('/api/account-reports', require('./src/routes/account-reports.routes'));
setupErrorHandler(app);

module.exports = app;
