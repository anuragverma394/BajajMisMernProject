function parseIsoDate(v) {
  const s = String(v || '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

function badRequest(message) {
  const err = new Error(message);
  err.statusCode = 400;
  throw err;
}

function validateFromTo(req, required = false) {
  const b = req?.body || {};
  const q = req?.query || {};
  const from = parseIsoDate(b.fromDate || b.dateFrom || q.fromDate || q.dateFrom);
  const to = parseIsoDate(b.toDate || b.dateTo || q.toDate || q.dateTo);
  if (required && (!from || !to)) badRequest('fromDate and toDate are required in YYYY-MM-DD format');
  if (from && to && from > to) badRequest('fromDate cannot be greater than toDate');
}

const validateRequest = {
  TargetRpt(req) { validateFromTo(req, false); },
  TrackingReport(req) { validateFromTo(req, false); },
  GrowerMeetingReport(req) { validateFromTo(req, false); },
  LiveLocationRpt(req) { validateFromTo(req, false); }
};

module.exports = { validateRequest };
