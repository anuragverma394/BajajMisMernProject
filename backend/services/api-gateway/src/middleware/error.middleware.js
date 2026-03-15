function notFoundHandler(req, res) {
  return res.status(404).json({ success: false, message: 'Route not found', data: null, error: 'NOT_FOUND' });
}

function errorHandler(err, req, res, next) {
  console.error('gateway_error', {
    message: err.message,
    stack: err.stack,
    path: req.originalUrl
  });

  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    data: null,
    error: err.code || 'INTERNAL_ERROR'
  });
}

module.exports = { notFoundHandler, errorHandler };
