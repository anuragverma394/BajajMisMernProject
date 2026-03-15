function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    data: null,
    error: 'NOT_FOUND'
  });
}

function errorHandler(err, req, res, next) {
  const statusCode = Number(err.statusCode || err.status || 500);
  const safeStatusCode = Number.isFinite(statusCode) && statusCode >= 400 && statusCode < 600
    ? statusCode
    : 500;
  const isServerError = safeStatusCode >= 500;
  const isDev = String(process.env.NODE_ENV || 'production').toLowerCase() === 'development';

  console.error('[API ERROR]', {
    method: req.method,
    path: req.originalUrl,
    statusCode: safeStatusCode,
    userId: req.user?.userId || null,
    season: req.user?.season || null,
    query: req.query || {},
    bodyKeys: Object.keys(req.body || {}),
    message: err.message,
    stack: isDev ? err.stack : undefined,
    sqlCode: err.code || null,
    sqlNumber: err.number || null,
    sqlMessage: err.originalError?.message || null
  });

  const responseMessage = isDev && isServerError
    ? err.message || 'Internal server error'
    : (isServerError ? 'Internal server error' : (err.message || 'Request failed'));

  res.status(safeStatusCode).json({
    success: false,
    message: responseMessage,
    data: null,
    error: err.code || err.name || 'REQUEST_FAILED',
    ...(isDev && isServerError && { details: err.message })
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
