const { z } = require('zod');
const { asId, asPositiveInt, asTrimmedString, parseJsonArray } = require('./common.validation');

// Helper function to convert DOB to YYYY-MM-DD format
function formatDOB(dobValue) {
  if (!dobValue || !String(dobValue).trim()) return '';

  const dobStr = String(dobValue).trim();

  // Already in YYYY-MM-DD format?
  if (/^\d{4}-\d{2}-\d{2}$/.test(dobStr)) return dobStr;

  // Try DD/MM/YYYY format
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dobStr)) {
    const parts = dobStr.split('/');
    return `${parts[2]}-${String(parts[1]).padStart(2, '0')}-${String(parts[0]).padStart(2, '0')}`;
  }

  // Try DD/MMM/YYYY format (e.g., 08/Jul/1999)
  const monthMap = { 'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06', 'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12' };
  const match = dobStr.match(/^(\d{1,2})\/([a-z]{3})\/(\d{4})$/i);
  if (match) {
    const [, day, month, year] = match;
    const monthNum = monthMap[month.toLowerCase()];
    if (monthNum) return `${year}-${monthNum}-${String(day).padStart(2, '0')}`;
  }

  // Try YYYY/MM/DD format
  if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(dobStr)) {
    const parts = dobStr.split('/');
    return `${parts[0]}-${String(parts[1]).padStart(2, '0')}-${String(parts[2]).padStart(2, '0')}`;
  }

  // Return original if no conversion possible (will be caught by SQL)
  return dobStr;
}

// Helper function to format TimeFrom/TimeTo to HHMM format
function formatTime(timeValue) {
  if (!timeValue && timeValue !== 0) return '0600';

  const timeStr = String(timeValue).trim();
  if (!timeStr) return '0600';

  // Already in HHMM format (4 digits)?
  if (/^\d{4}$/.test(timeStr)) return timeStr;

  // Single or double digit hour? Pad to HHMM
  if (/^\d{1,2}$/.test(timeStr)) {
    const hour = String(timeStr).padStart(2, '0');
    return `${hour}00`;
  }

  // HH:MM format with colon?
  if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
    const [hour, minute] = timeStr.split(':');
    return `${String(hour).padStart(2, '0')}${String(minute).padStart(2, '0')}`;
  }

  // Return as-is if already reasonable, or default
  return /^\d{4}$/.test(timeStr) ? timeStr : '0600';
}

const upsertUserSchema = z.object({
  ID: z.union([z.string(), z.number()]).optional(),
  Userid: z.string().min(1),
  UTID: z.union([z.string(), z.number()]),
  Name: z.string().min(1),
  Password: z.string().optional(),
  SAPCode: z.string().optional(),
  Mobile: z.string().optional(),
  EmailID: z.string().optional(),
  DOB: z.string().optional(),
  Gender: z.string().optional(),
  Type: z.string().optional(),
  Status: z.string().optional(),
  TimeFrom: z.string().optional(),
  TimeTo: z.string().optional(),
  GPS_Notification: z.union([z.boolean(), z.number(), z.string()]).optional(),
  units: z.array(z.any()).optional(),
  seasons: z.array(z.any()).optional()
});

function validateUpsertUser(req) {
  const body = req.body || {};
  const userId = asId(body.userid || body.Userid, 50);
  const userType = asPositiveInt(body.UTID);
  const name = asTrimmedString(body.Name, 120);
  const password = asTrimmedString(body.Password, 256);

  if (!userId) return 'userid/Userid is required and must be alphanumeric';
  if (!userType) return 'UTID is required and must be a positive integer';
  if (!name) return 'Name is required';
  if (!String(body.ID || '').trim() && !password) return 'Password is required for new user';

  const units = parseJsonArray(body.units, []).map((u) => asId(u, 20)).filter(Boolean);
  const seasons = parseJsonArray(body.seasons, []).map((s) => asId(s, 10)).filter(Boolean);

  req.validatedUserBody = {
    ID: asPositiveInt(body.ID),
    Userid: userId,
    UTID: userType,
    Name: name,
    Password: password,
    SAPCode: asTrimmedString(body.SAPCode, 60),
    Mobile: asTrimmedString(body.Mobile, 20),
    EmailID: asTrimmedString(body.EmailID, 120),
    DOB: formatDOB(body.DOB),
    Gender: asTrimmedString(body.Gender || '1', 5) || '1',
    Type: asTrimmedString(body.Type || 'Other', 20) || 'Other',
    Status: asTrimmedString(body.Status || '1', 5) || '1',
    TimeFrom: formatTime(body.TimeFrom),
    TimeTo: formatTime(body.TimeTo),
    GPS_Notification: body.GPS_Notification ? 1 : 0,
    units,
    seasons
  };

  return true;
}

function validateUpdateLabNotification(req) {
  const rows = Array.isArray(req.body) ? req.body : (Array.isArray(req.body?.model) ? req.body.model : []);
  if (!rows.length) return 'No data received';

  const normalized = rows
    .map((row) => ({
      UFID: asPositiveInt(row?.UFID),
      LNFlag: row?.LNFlag ? 1 : 0
    }))
    .filter((x) => x.UFID);

  if (!normalized.length) return 'No valid UFID rows provided';
  const schema = z.array(z.object({
    UFID: z.number().int().positive(),
    LNFlag: z.number().int().min(0).max(1)
  }));
  const result = schema.safeParse(normalized);
  if (!result.success) {
    return result.error.issues[0]?.message || 'Invalid notification payload';
  }

  req.validatedLabNotifications = result.data;
  return true;
}

module.exports = {
  validateUpsertUser,
  validateUpdateLabNotification
};
