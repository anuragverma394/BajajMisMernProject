async function authenticate(req, res, next) {
  const auth = req.headers.authorization || '';
  
  // Log for debugging
  const method = req.method;
  const path = req.path;
  const ip = req.ip || req.connection.remoteAddress;
  
  if (!auth.startsWith('Bearer ')) {
    console.warn(`[AUTH] Missing/invalid token - Method: ${method}, Path: ${path}, IP: ${ip}`);
    return res.status(401).json({ 
      success: false, 
      message: 'Missing or invalid authorization token. Please ensure the Authorization header is set with format: Bearer <token>', 
      data: null, 
      error: 'UNAUTHORIZED',
      code: 'NO_TOKEN'
    });
  }

  try {
    const verifyUrl = `${process.env.AUTH_SERVICE_URL}/api/account/verify`;
    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        Authorization: auth,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      console.warn(`[AUTH] Token validation failed - Status: ${response.status}, Path: ${path}, IP: ${ip}`);
      return res.status(401).json({ 
        success: false, 
        message: 'Token validation failed. Please login again.', 
        data: null, 
        error: 'UNAUTHORIZED',
        code: 'INVALID_TOKEN'
      });
    }

    req.user = data.data;
    console.log(`[AUTH] Success - User: ${data.data?.userId}, Path: ${path}`);
    return next();
  } catch (err) {
    console.error(`[AUTH] Authentication error: ${err.message} - Path: ${path}, IP: ${ip}`);
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication service unavailable', 
      data: null, 
      error: 'INTERNAL_ERROR',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
}

module.exports = { authenticate };
