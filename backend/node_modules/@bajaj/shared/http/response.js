const attachResponseHelpers = (req, res, next) => {
  res.successResponse = (message, data = null, statusCode = 200) => {
    return res.status(statusCode).json({
      status: 'success',
      message,
      data,
    });
  };

  res.errorResponse = (message, error = null, statusCode = 500) => {
    return res.status(statusCode).json({
      status: 'error',
      message,
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  };

  next();
};

const successResponse = (res, statusCode, message, data = null) => {
  res.status(statusCode).json({
    status: 'success',
    message,
    data,
  });
};

const errorResponse = (res, statusCode, message, error = null) => {
  res.status(statusCode).json({
    status: 'error',
    message,
    error,
  });
};

module.exports = {
  attachResponseHelpers,
  successResponse,
  errorResponse
};
