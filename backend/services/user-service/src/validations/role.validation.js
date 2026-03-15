const { z } = require('zod');
const { asBinaryFlag, asId, asTrimmedString, parseJsonArray, parseCodeList } = require('./common.validation');

const permissionRowSchema = z.object({
  MID: z.string().min(1),
  RADD: z.string(),
  RUPDATE: z.string(),
  RDELETE: z.string(),
  RVIEW: z.string(),
  REXPORT: z.string(),
  RPRINT: z.string(),
  RSEARCH: z.string(),
  RNotification: z.string()
});

function normalizeRolePermissionRow(row = {}) {
  return {
    MID: asId(row.MID, 20),
    RADD: asBinaryFlag(row.RADD),
    RUPDATE: asBinaryFlag(row.RUPDATE),
    RDELETE: asBinaryFlag(row.RDELETE),
    RVIEW: asBinaryFlag(row.RVIEW),
    REXPORT: asBinaryFlag(row.REXPORT),
    RPRINT: asBinaryFlag(row.RPRINT),
    RSEARCH: asBinaryFlag(row.RSEARCH),
    RNotification: asBinaryFlag(row.RNotification)
  };
}

function validateUpsertRole(req) {
  const body = req.body || {};
  const command = asTrimmedString(body.Command, 20).toLowerCase();
  const R_Code = asId(body.R_Code, 20);
  const R_Name = asTrimmedString(body.R_Name, 120);
  const rows = parseJsonArray(body.TableDataGuest, []).map(normalizeRolePermissionRow);
  const enabledRows = rows.filter((r) =>
    r.MID && [r.RADD, r.RUPDATE, r.RDELETE, r.RVIEW, r.REXPORT, r.RPRINT, r.RSEARCH, r.RNotification].includes('1')
  );

  if (!R_Code) return 'R_Code is required';
  if (!R_Name) return 'R_Name is required';
  if (!['btninsert', 'btupdate'].includes(command)) return 'Command must be btninsert or btupdate';

  req.validatedRoleBody = {
    command,
    R_Code,
    R_Name,
    permissions: enabledRows
  };

  const schema = z.object({
    command: z.enum(['btninsert', 'btupdate']),
    R_Code: z.string().min(1),
    R_Name: z.string().min(1),
    permissions: z.array(permissionRowSchema)
  });
  const result = schema.safeParse(req.validatedRoleBody);
  if (!result.success) {
    return result.error.issues[0]?.message || 'Invalid role payload';
  }

  req.validatedRoleBody = result.data;
  return true;
}

function validateRoleCodeList(req) {
  const text = String(req.query.rcode || req.body?.rcode || req.query.r_code || req.body?.r_code || '').trim();
  req.validatedRoleCodes = parseCodeList(text);
  return true;
}

module.exports = {
  validateUpsertRole,
  validateRoleCodeList
};
