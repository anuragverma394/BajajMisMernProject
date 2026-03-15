function validate(schema) {
  return (req, res, next) => {
    try {
      if (!schema || typeof schema !== 'function') return next();
      const result = schema(req);
      if (result === true || result == null) return next();

      const message = typeof result === 'string'
        ? result
        : (result.message || 'Validation failed');
      return res.status(400).json({
        success: false,
        message,
        data: null,
        error: 'VALIDATION_ERROR'
      });
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = {
  validate
};
