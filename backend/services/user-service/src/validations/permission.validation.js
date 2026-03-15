const { z } = require('zod');
const { asBinaryFlag, asId, asTrimmedString, parseCodeList, parseJsonArray } = require('./common.validation');

function validateAssignPermissions(req) {
  const body = req.body || {};
  const command = asTrimmedString(body.Command, 20).toLowerCase();
  if (!['btninsert', 'btupdate'].includes(command)) {
    return 'Command must be btninsert or btupdate';
  }

  const userCode = asId(body.Usercode, 50);
  if (!userCode) return 'Usercode is required';

  const roleCodes = parseCodeList(body.rollcode || '');
  const units = parseJsonArray(body.unitS, [])
    .map((u) => asId(u?.f_Code, 20))
    .filter(Boolean);
  const extras = parseJsonArray(body.AllArry, [])
    .map((x) => ({
      MID: asId(x?.MID, 20),
      RADD: asBinaryFlag(x?.RADD),
      RUPDATE: asBinaryFlag(x?.RUPDATE),
      RDELETE: asBinaryFlag(x?.RDELETE),
      RVIEW: asBinaryFlag(x?.RVIEW),
      REXPORT: asBinaryFlag(x?.REXPORT),
      RPRINT: asBinaryFlag(x?.RPRINT),
      RSEARCH: asBinaryFlag(x?.RSEARCH),
      RNotification: asBinaryFlag(x?.RNotification)
    }))
    .filter((x) => x.MID && [x.RADD, x.RUPDATE, x.RDELETE, x.RVIEW, x.REXPORT, x.RPRINT, x.RSEARCH, x.RNotification].includes('1'));

  if (!units.length) return 'At least one unit is required';

  req.validatedPermissionBody = {
    command,
    userCode,
    roleCodes,
    units,
    extras
  };

  const schema = z.object({
    command: z.enum(['btninsert', 'btupdate']),
    userCode: z.string().min(1),
    roleCodes: z.array(z.string()),
    units: z.array(z.string().min(1)).min(1),
    extras: z.array(z.object({
      MID: z.string().min(1),
      RADD: z.string(),
      RUPDATE: z.string(),
      RDELETE: z.string(),
      RVIEW: z.string(),
      REXPORT: z.string(),
      RPRINT: z.string(),
      RSEARCH: z.string(),
      RNotification: z.string()
    }))
  });

  const result = schema.safeParse(req.validatedPermissionBody);
  if (!result.success) {
    return result.error.issues[0]?.message || 'Invalid permission payload';
  }

  req.validatedPermissionBody = result.data;
  return true;
}

module.exports = {
  validateAssignPermissions
};
