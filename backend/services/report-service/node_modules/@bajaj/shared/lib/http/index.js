/**
 * Shared HTTP utilities
 */

const response = require('./response');
const errors = require('./errors');

module.exports = {
  ...response,
  ...errors
};
