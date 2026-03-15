const jwt = require('jsonwebtoken');

function signAuthToken(payload) {
  const secret = process.env.APP_JWT_SECRET || process.env.JWT_SECRET || 'change_me';
  const expiresIn = process.env.JWT_EXPIRES_IN || '1d';
  return jwt.sign(payload, secret, { expiresIn });
}

function requireAuth(req, res, next) {
  try {
    // First, try to get user from API Gateway headers (if coming through API Gateway)
    const userIdHeader = req.headers['x-user-id'];
    if (userIdHeader) {
      req.user = {
        userId: userIdHeader,
        id: req.headers['x-user-id'],
        name: req.headers['x-user-name'] || '',
        utid: req.headers['x-user-utid'] || '',
        factId: req.headers['x-user-fact-id'] || '',
        season: req.headers['x-user-season'] || '2526',
        connectionSeason: req.headers['x-user-connection-season'] || ''
      };
      return next();
    }

    // Fallback: verify JWT token locally (for direct service calls)
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized', data: null });
    }

    try {
      const secret = process.env.APP_JWT_SECRET || process.env.JWT_SECRET || 'change_me';
      const payload = jwt.verify(token, secret);
      req.user = payload;
      return next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Invalid token', data: null });
    }
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Authentication failed', data: null });
  }
}

module.exports = {
  signAuthToken,
  requireAuth
};
