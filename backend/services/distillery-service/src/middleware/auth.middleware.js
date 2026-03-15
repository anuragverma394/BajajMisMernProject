const jwt = require('jsonwebtoken');

function signAuthToken(payload) {
  const secret = process.env.APP_JWT_SECRET || process.env.JWT_SECRET || 'change_me';
  const expiresIn = process.env.JWT_EXPIRES_IN || '1d';
  return jwt.sign(payload, secret, { expiresIn });
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const secret = process.env.APP_JWT_SECRET || process.env.JWT_SECRET || 'change_me';
    const payload = jwt.verify(token, secret);
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

module.exports = {
  signAuthToken,
  requireAuth
};
