const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

function buildTargetUrl(target, basePath, req, routePrefix) {
  const suffix = req.originalUrl.replace(`/api/${routePrefix}`, '') || '';
  const url = new URL(`${String(target || '').replace(/\/+$/, '')}${basePath}${suffix}`);

  Object.entries(req.query || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => url.searchParams.append(key, item));
      return;
    }
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  return url;
}

function forwardToService(target, basePath, routePrefix) {
  return async (req, res, next) => {
    try {
      const url = buildTargetUrl(target, basePath, req, routePrefix);
      const headers = {
        'content-type': 'application/json'
      };

      if (req.headers.authorization) {
        headers.authorization = req.headers.authorization;
      }

      if (req.user) {
        headers['x-user-id'] = req.user.userId || req.user.id || '';
        headers['x-user-name'] = req.user.name || '';
        headers['x-user-utid'] = req.user.utid || '';
        headers['x-user-fact-id'] = req.user.factId || '';
        headers['x-user-season'] = req.user.season || '';
        headers['x-user-connection-season'] = req.user.connectionSeason || '';
      }

      const response = await fetch(url, {
        method: req.method,
        headers,
        body: ['GET', 'HEAD'].includes(req.method.toUpperCase()) ? undefined : JSON.stringify(req.body || {})
      });

      const contentType = response.headers.get('content-type') || '';
      const payload = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

      return res.status(response.status).send(payload);
    } catch (error) {
      return next(error);
    }
  };
}

router.use('/account', forwardToService(process.env.AUTH_SERVICE_URL, '/api/account', 'account'));
router.use('/user-management', authenticate, forwardToService(process.env.USER_SERVICE_URL, '/api/user-management', 'user-management'));
router.use('/dashboard', authenticate, forwardToService(process.env.DASHBOARD_SERVICE_URL, '/api/dashboard', 'dashboard'));
router.use('/main', authenticate, forwardToService(process.env.DASHBOARD_SERVICE_URL, '/api/main', 'main'));
router.use('/bajaj-mis-service', authenticate, forwardToService(process.env.DASHBOARD_SERVICE_URL, '/api/bajaj-mis-service', 'bajaj-mis-service'));
router.use('/report', authenticate, forwardToService(process.env.REPORT_SERVICE_URL, '/api/report', 'report'));
router.use('/report-new', authenticate, forwardToService(process.env.REPORT_SERVICE_URL, '/api/report-new', 'report-new'));
router.use('/new-report', authenticate, forwardToService(process.env.REPORT_SERVICE_URL, '/api/new-report', 'new-report'));
router.use('/account-reports', authenticate, forwardToService(process.env.REPORT_SERVICE_URL, '/api/account-reports', 'account-reports'));
router.use('/lab', authenticate, forwardToService(process.env.LAB_SERVICE_URL, '/api/lab', 'lab'));
router.use('/survey-report', authenticate, forwardToService(process.env.SURVEY_SERVICE_URL, '/api/survey-report', 'survey-report'));
router.use('/survey-service', authenticate, forwardToService(process.env.SURVEY_SERVICE_URL, '/api/survey-service', 'survey-service'));
router.use('/and-wmt', authenticate, forwardToService(process.env.SURVEY_SERVICE_URL, '/api/and-wmt', 'and-wmt'));
router.use('/tracking', authenticate, forwardToService(process.env.TRACKING_SERVICE_URL, '/api/tracking', 'tracking'));
router.use('/distillery', authenticate, forwardToService(process.env.DISTILLERY_SERVICE_URL, '/api/distillery', 'distillery'));
router.use('/whats-app', authenticate, forwardToService(process.env.WHATSAPP_SERVICE_URL, '/api/whats-app', 'whats-app'));
router.use('/bajaj-mis-service', authenticate, forwardToService(process.env.DASHBOARD_SERVICE_URL, '/api/bajaj-mis-service', 'bajaj-mis-service'));
router.use('/report', authenticate, forwardToService(process.env.REPORT_SERVICE_URL, '/api/report', 'report'));
router.use('/report-new', authenticate, forwardToService(process.env.REPORT_SERVICE_URL, '/api/report-new', 'report-new'));
router.use('/new-report', authenticate, forwardToService(process.env.REPORT_SERVICE_URL, '/api/new-report', 'new-report'));
router.use('/account-reports', authenticate, forwardToService(process.env.REPORT_SERVICE_URL, '/api/account-reports', 'account-reports'));
router.use('/lab', authenticate, forwardToService(process.env.LAB_SERVICE_URL, '/api/lab', 'lab'));
router.use('/survey-report', authenticate, forwardToService(process.env.SURVEY_SERVICE_URL, '/api/survey-report', 'survey-report'));
router.use('/survey-service', authenticate, forwardToService(process.env.SURVEY_SERVICE_URL, '/api/survey-service', 'survey-service'));
router.use('/and-wmt', authenticate, forwardToService(process.env.SURVEY_SERVICE_URL, '/api/and-wmt', 'and-wmt'));
router.use('/tracking', authenticate, forwardToService(process.env.TRACKING_SERVICE_URL, '/api/tracking', 'tracking'));
router.use('/distillery', authenticate, forwardToService(process.env.DISTILLERY_SERVICE_URL, '/api/distillery', 'distillery'));
router.use('/whats-app', authenticate, forwardToService(process.env.WHATSAPP_SERVICE_URL, '/api/whats-app', 'whats-app'));

module.exports = router;
