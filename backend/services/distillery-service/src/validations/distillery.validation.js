const { z } = require('zod');

const reportSchema = z.object({
  factory: z.string().optional(),
  from: z.string().min(1, 'from date is required'),
  to: z.string().min(1, 'to date is required')
});

function parseReport(req) {
  const data = {
    factory: String(req.query.factory || req.query.F_Code || req.body?.factory || req.body?.F_Code || '').trim() || undefined,
    from: String(req.query.from || req.query.fromDate || req.body?.from || req.body?.fromDate || '').trim(),
    to: String(req.query.to || req.query.toDate || req.body?.to || req.body?.toDate || '').trim()
  };

  const result = reportSchema.safeParse(data);
  if (result.success) {
    return { ok: true, data: result.data };
  }

  return { ok: false, message: result.error.issues[0]?.message || 'Validation failed' };
}

module.exports = {
  parseReport
};
