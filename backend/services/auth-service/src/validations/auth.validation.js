const { z } = require('zod');

const loginSchema = z.object({
  userId: z.string().min(1, 'Name is required'),
  password: z.string().min(1, 'Password is required'),
  season: z.string().optional()
});

const changePasswordSchema = z.object({
  userId: z.string().min(1, 'User context missing'),
  oldPassword: z.string().min(1, 'Password is required'),
  newPassword: z.string().min(1, 'New password is required'),
  confirmPassword: z.string().min(1, 'Confirm password is required'),
  season: z.string().optional()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Password does not match',
  path: ['confirmPassword']
});

const pageLoadSchema = z.object({
  userId: z.string().optional(),
  utid: z.string().min(1, 'utid is required'),
  season: z.string().optional()
});

const checkPageSchema = z.object({
  userId: z.string().min(1, 'userName is required'),
  formId: z.string().min(1, 'formId is required'),
  season: z.string().optional()
});

const updateDateSchema = z.object({
  code: z.string().min(1, 'code is required'),
  date: z.string().min(1, 'date is required'),
  season: z.string().optional()
});

const migrateSchema = z.object({
  limit: z.number().int().min(1).max(1000).optional(),
  season: z.string().optional()
});

function parseSchema(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  return { ok: false, message: result.error.issues[0]?.message || 'Validation failed' };
}

function parseLogin(req) {
  const data = {
    userId: String(req.body?.Name || req.body?.userid || '').trim(),
    password: String(req.body?.Password || req.body?.password || '').trim(),
    season: req.body?.season
  };
  return parseSchema(loginSchema, data);
}

function parseChangePassword(req, userId) {
  const data = {
    userId: String(userId || '').trim(),
    oldPassword: String(req.body?.Password || req.body?.password || '').trim(),
    newPassword: String(req.body?.NewPassword || req.body?.newPassword || '').trim(),
    confirmPassword: String(req.body?.ConfPassword || req.body?.confPassword || '').trim(),
    season: req.body?.season
  };
  return parseSchema(changePasswordSchema, data);
}

function parsePageLoad(req) {
  const data = {
    userId: String(req.user?.userId || req.query?.userId || '').trim() || undefined,
    utid: String(req.user?.utid || req.query?.utid || '').trim(),
    season: req.user?.season || req.query?.season
  };
  return parseSchema(pageLoadSchema, data);
}

function parseCheckPage(req) {
  const data = {
    userId: String(req.user?.userId || req.query?.userName || req.body?.userName || '').trim(),
    formId: String(req.query?.formId || req.body?.formId || '').trim(),
    season: req.user?.season || req.query?.season
  };
  return parseSchema(checkPageSchema, data);
}

function parseUpdateDate(req) {
  const data = {
    code: String(req.body?.code || '').trim(),
    date: String(req.body?.date || '').trim(),
    season: req.user?.season || req.body?.season
  };
  return parseSchema(updateDateSchema, data);
}

function parseMigrate(req) {
  const rawLimit = req.body?.limit ?? req.query?.limit;
  const limit = rawLimit == null ? undefined : Number(rawLimit);
  const data = {
    limit: Number.isFinite(limit) ? limit : undefined,
    season: req.user?.season || req.body?.season || req.query?.season
  };
  return parseSchema(migrateSchema, data);
}

module.exports = {
  parseLogin,
  parseChangePassword,
  parsePageLoad,
  parseCheckPage,
  parseUpdateDate,
  parseMigrate
};
