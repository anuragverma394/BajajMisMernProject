function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    data: null
  });
}

function errorHandler(err, req, res, next) {
  const statusCode = Number(err.statusCode || err.status || 500);
  const safeStatusCode = Number.isFinite(statusCode) && statusCode >= 400 && statusCode < 600
    ? statusCode
    : 500;
  const isServerError = safeStatusCode >= 500;

  console.error('[API ERROR]', {
    method: req.method,
    path: req.originalUrl,
    statusCode: safeStatusCode,
    userId: req.user?.userId || null,
    season: req.user?.season || null,
    query: req.query || {},
    bodyKeys: Object.keys(req.body || {}),
    message: err.message,
    stack: err.stack,
    sqlCode: err.code || null,
    sqlNumber: err.number || null
  });

  res.status(safeStatusCode).json({
    success: false,
    message: isServerError ? 'Internal server error' : (err.message || 'Request failed'),
    data: null
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
