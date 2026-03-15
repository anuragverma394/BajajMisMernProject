/**
 * Unified Authentication Middleware
 * Supports both API Gateway header authentication and direct JWT verification
 */

const jwt = require('jsonwebtoken');
const { getLogger } = require('../utils/logger');
const { UnauthorizedError } = require('../http/errors');

const logger = getLogger('auth-middleware');

/**
 * Sign a JWT token
 */
function signAuthToken(payload, options = {}) {
  const secret = process.env.APP_JWT_SECRET || process.env.JWT_SECRET || 'change_me_in_production';
  const expiresIn = options.expiresIn || process.env.JWT_EXPIRES_IN || '1d';
  
  if (process.env.NODE_ENV === 'production' && secret === 'change_me_in_production') {
    logger.warn('Using default JWT secret in production - SECURITY RISK');
  }

  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Verify JWT token
 */
function verifyToken(token, options = {}) {
  const secret = process.env.APP_JWT_SECRET || process.env.JWT_SECRET || 'change_me_in_production';
  
  try {
    return jwt.verify(token, secret);
  } catch (err) {
    logger.debug('Token verification failed', { error: err.message });
    throw new UnauthorizedError('Invalid or expired token', 'INVALID_TOKEN');
  }
}

/**
 * Extract token from Authorization header
 */
function extractToken(authHeader = '') {
  if (!authHeader) return null;
  
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  
  return null;
}

/**
 * Extract user from API Gateway headers
 * Assumes gateway sets standard headers: x-user-id, x-user-name, x-user-utid, x-user-fact-id, x-user-season
 */
function extractUserFromGatewayHeaders(headers = {}) {
  const userId = headers['x-user-id'];
  
  if (!userId) return null;

  return {
    id: userId,
    userId: userId,
    name: headers['x-user-name'] || '',
    utid: headers['x-user-utid'] || '',
    factId: headers['x-user-fact-id'] || '',
    factoryId: headers['x-user-fact-id'] || '',
    season: headers['x-user-season'] || process.env.DEFAULT_SEASON || '2526',
    connectionSeason: headers['x-user-connection-season'] || '',
    source: 'gateway'
  };
}

/**
 * Main authentication middleware
 * Priority: Gateway Headers > JWT Token > Fail
 */
async function requireAuth(req, res, next) {
  try {
    req.id = req.headers['x-request-id'] || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Step 1: Check API Gateway headers (if coming through gateway)
    const gatewayUser = extractUserFromGatewayHeaders(req.headers);
    if (gatewayUser) {
      req.user = gatewayUser;
      logger.debug('Auth successful - Gateway headers', { userId: gatewayUser.userId });
      return next();
    }

    // Step 2: Check JWT token (for direct service-to-service calls)
    const authHeader = req.headers.authorization || '';
    const token = extractToken(authHeader);

    if (!token) {
      logger.warn('Unauthorized - No token provided', { 
        method: req.method, 
        path: req.path,
        ip: req.ip 
      });
      
      return res.status(401).json({
        success: false,
        message: 'Missing authorization token',
        errorCode: 'NO_TOKEN',
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    }

    // Verify token
    const payload = verifyToken(token);
    req.user = {
      id: payload.id || payload.userId,
      userId: payload.userId || payload.id,
      utid: payload.utid,
      name: payload.name || '',
      factId: payload.factId,
      season: payload.season || process.env.DEFAULT_SEASON || '2526',
      source: 'jwt'
    };

    logger.debug('Auth successful - JWT token', { userId: req.user.userId });
    return next();

  } catch (err) {
    logger.error('Authentication error', err, {
      method: req.method,
      path: req.path,
      ip: req.ip
    });

    if (err instanceof UnauthorizedError) {
      return res.status(401).json({
        success: false,
        message: err.message,
        errorCode: err.errorCode,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication service error',
      errorCode: 'AUTH_ERROR',
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }
}

/**
 * Optional authentication (doesn't fail if no auth)
 */
async function optionalAuth(req, res, next) {
  try {
    req.id = req.headers['x-request-id'] || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Try gateway headers
    const gatewayUser = extractUserFromGatewayHeaders(req.headers);
    if (gatewayUser) {
      req.user = gatewayUser;
      return next();
    }

    // Try JWT
    const authHeader = req.headers.authorization || '';
    const token = extractToken(authHeader);
    
    if (token) {
      try {
        req.user = verifyToken(token);
      } catch (err) {
        logger.debug('Optional auth - Token verification failed');
        req.user = null;
      }
    } else {
      req.user = null;
    }

    return next();

  } catch (err) {
    logger.error('Optional auth error', err);
    req.user = null;
    return next();
  }
}

/**
 * Check if user has specific permission (requires database call)
 * This is intentionally left generic - services should implement their own
 */
function requirePermission(requiredPermission) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        errorCode: 'UNAUTHORIZED',
        timestamp: new Date().toISOString()
      });
    }

    // Services should override this with actual permission check
    // For now, just pass through
    return next();
  };
}

module.exports = {
  signAuthToken,
  verifyToken,
  extractToken,
  extractUserFromGatewayHeaders,
  requireAuth,
  optionalAuth,
  requirePermission
};
