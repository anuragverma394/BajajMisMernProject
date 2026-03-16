/**
 * Gets season from request
 * @param {Object} req - Express request object
 * @returns {string} Season value (e.g., '2526')
 */
function getSeason(req) {
  return req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526';
}

/**
 * Gets factory code from request with multiple key fallbacks
 * @param {Object} req - Express request object
 * @param {...string} keys - Keys to check for factory code
 * @returns {string} Factory code or empty string
 */
function getFactoryCode(req, ...keys) {
  for (const key of keys) {
    const value = req.query?.[key] ?? req.body?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '' && String(value).trim() !== 'All') {
      return String(value).trim();
    }
  }
  return '';
}

/**
 * Combines query and body params (body overwrites query)
 * @param {Object} req - Express request object
 * @returns {Object} merged params
 */
function getParams(req) {
  return { ...(req.query || {}), ...(req.body || {}) };
}

module.exports = {
  getSeason,
  getFactoryCode,
  getParams
};
