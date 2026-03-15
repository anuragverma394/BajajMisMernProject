/**
 * Shared Middleware Functions
 */

const auth = require('./auth.middleware');
const error = require('./error.middleware');
const { validate, commonSchemas, combineSchemas, z } = require('./validate.middleware');

module.exports = {
  // Auth
  ...auth,
  
  // Error
  ...error,
  
  // Validation
  validate,
  commonSchemas,
  combineSchemas,
  z
};
