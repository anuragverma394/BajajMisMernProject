const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: 'Resource not found'
  });
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : undefined
  });
};

module.exports = {
  notFoundHandler,
  errorHandler
};
