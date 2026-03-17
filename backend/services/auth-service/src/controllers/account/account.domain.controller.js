const { catchAsync } = require('@bajaj/shared');
const service = require('../../services/auth.service');
const validation = require('../../validations/auth.validation');

const CONTROLLER = 'Account';

function logFailedLoginAttempt(userId, season, reason) {
  const shouldLog = String(process.env.LOGIN_DEBUG || '').toLowerCase() === 'true' || process.env.NODE_ENV !== 'production';
  if (!shouldLog) return;
  console.warn(`[AUTH][LOGIN_FAILED] userId="${userId}" season="${season}" reason="${reason}"`);
}

exports.Login = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use POST /api/account/login-2 with Name and Password',
    data: null
  });
};

exports.ConvertLoginId = (req, res) => {
  const season = req.query.season || req.body.season || process.env.DEFAULT_SEASON || '2526';
  return res.status(200).json({
    success: true,
    message: 'Converted login season',
    data: {
      season,
      convertedSeason: service.convertLoginId(season)
    }
  });
};

exports.Login_2 = catchAsync(async (req, res, next) => {
  const parsed = validation.parseLogin(req);
  if (!parsed.ok) {
    const season = service.resolveSeason(req.body?.season);
    const userId = String(req.body?.Name || req.body?.userid || '').trim();
    logFailedLoginAttempt(userId || '', season, 'missing_credentials');
    return res.status(400).json({ success: false, message: parsed.message, data: null });
  }

  const { userId, password, season } = parsed.data;
  const resolvedSeason = service.resolveSeason(season);

  const authData = await service.login({ userId, password, season: resolvedSeason });
  return res.status(200).json({
    success: true,
    message: 'Login successful',
    data: authData
  });
});

exports.ChangePassword = (req, res) => {
  return res.status(200).json({ success: true, message: 'Use POST /api/account/change-password-2', data: null });
};

exports.ChangePassword_2 = catchAsync(async (req, res) => {
  const season = service.resolveSeason(req.user?.season || req.body?.season);
  const userId = String(req.user?.userId || req.body?.userId || '').trim();
  const parsed = validation.parseChangePassword(req, userId);
  if (!parsed.ok) {
    return res.status(400).json({ success: false, message: parsed.message, data: null });
  }

  const result = await service.changePassword({
    userId: parsed.data.userId,
    oldPassword: parsed.data.oldPassword,
    newPassword: parsed.data.newPassword,
    season
  });

  return res.status(200).json({ success: true, message: 'Password updated', data: result });
});

exports.Logout = (req, res) => {
  return res.status(200).json({ success: true, message: 'Logged out. Discard token on client.', data: null });
};

exports.PageLoad = catchAsync(async (req, res) => {
  const parsed = validation.parsePageLoad(req);
  if (!parsed.ok) {
    return res.status(400).json({ success: false, message: parsed.message, data: null });
  }

  const season = service.resolveSeason(parsed.data.season);
  const utid = parsed.data.utid;
  const userId = String(parsed.data.userId || '').trim();

  if (utid !== '1' && !userId) {
    return res.status(400).json({ success: false, message: 'userId is required', data: null });
  }

  const rows = await service.pageLoad({ userId, utid, season });
  return res.status(200).json({ success: true, message: 'Module permissions', data: rows });
});

exports.CheckPageVald = catchAsync(async (req, res) => {
  const parsed = validation.parseCheckPage(req);
  if (!parsed.ok) {
    return res.status(400).json({ success: false, message: parsed.message, data: null });
  }

  const season = service.resolveSeason(parsed.data.season);
  const result = await service.checkPageValidation({
    userId: parsed.data.userId,
    formId: parsed.data.formId,
    season
  });
  return res.status(200).json({ success: true, message: 'Form permission', data: result });
});

exports.ManageTblControl = catchAsync(async (req, res) => {
  const season = service.resolveSeason(req.user?.season || req.query?.season);
  const rows = await service.manageTableControl({ season });
  return res.status(200).json({ success: true, message: 'Table control', data: rows });
});

exports.UpdateDate = catchAsync(async (req, res) => {
  const parsed = validation.parseUpdateDate(req);
  if (!parsed.ok) {
    return res.status(400).json({ success: false, message: parsed.message, data: null });
  }

  const season = service.resolveSeason(parsed.data.season);
  const result = await service.updateDate({ code: parsed.data.code, date: parsed.data.date, season });
  return res.status(200).json({ success: result.ok, message: result.ok ? 'Date updated' : 'No rows updated', data: result });
});

exports.MigratePasswords = catchAsync(async (req, res) => {
  const migrationKey = String(req.headers['x-migration-key'] || '').trim();
  const expected = String(process.env.MIGRATION_KEY || '').trim();
  if (!expected || migrationKey !== expected) {
    return res.status(403).json({ success: false, message: 'Forbidden', data: null });
  }

  const parsed = validation.parseMigrate(req);
  if (!parsed.ok) {
    return res.status(400).json({ success: false, message: parsed.message, data: null });
  }

  const season = service.resolveSeason(parsed.data.season);
  const result = await service.migratePasswords({ season, limit: parsed.data.limit });
  return res.status(200).json({ success: true, message: 'Password migration complete', data: result });
});

exports.Verify = (req, res) => {
  return res.status(200).json({ success: true, message: 'Token verified', data: req.user || null });
};

exports._controller = CONTROLLER;
