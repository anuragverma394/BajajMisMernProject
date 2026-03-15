/**
 * Shared Validation Middleware
 * Standardized request validation for all services
 */

/**
 * Generic validation middleware
 * Applies a validation schema/function to request
 * @param {Function} schema - Validation function that returns true/null on success, string on error
 * @returns {Function} Express middleware
 */
function validate(schema) {
  return (req, res, next) => {
    try {
      // Skip if no schema provided
      if (!schema || typeof schema !== 'function') {
        return next();
      }

      // Execute validation
      const result = schema(req);
      
      // Validation passed
      if (result === true || result == null) {
        return next();
      }

      // Validation failed - return error message
      const message = typeof result === 'string'
        ? result
        : (result?.message || 'Request validation failed');

      return res.status(400).json({
        success: false,
        message,
        data: null,
        error: 'VALIDATION_ERROR'
      });
    } catch (error) {
      // Validation threw error - pass to error handler
      return next(error);
    }
  };
}

module.exports = {
  validate
};
