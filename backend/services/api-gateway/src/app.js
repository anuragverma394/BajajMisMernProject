const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');

const app = express();
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);

app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : '*' }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'api-gateway healthy', data: { service: process.env.SERVICE_NAME } });
});

app.use('/api', routes);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
