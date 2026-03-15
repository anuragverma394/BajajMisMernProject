function parseIsoDate(value) {
  const raw = String(value || '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}

function parseDateRangeText(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const iso = raw.match(/^(\d{4}-\d{2}-\d{2})\s*-\s*(\d{4}-\d{2}-\d{2})$/);
  if (iso) return { from: iso[1], to: iso[2] };
  return null;
}

function resolveDateRange(req) {
  const b = req?.body || {};
  const q = req?.query || {};
  const txt = String(b.txtdaterange || q.txtdaterange || '').trim();
  const fromDate = parseIsoDate(b.dateFrom || b.fromDate || q.dateFrom || q.fromDate);
  const toDate = parseIsoDate(b.dateTo || b.toDate || q.dateTo || q.toDate);
  if (txt) return parseDateRangeText(txt);
  if (fromDate && toDate) return { from: fromDate, to: toDate };
  return null;
}

function badRequest(message) {
  const err = new Error(message);
  err.statusCode = 400;
  throw err;
}

function validateDateRange(req, required = false) {
  const range = resolveDateRange(req);
  if (required && !range) badRequest('dateFrom and dateTo (YYYY-MM-DD) or txtdaterange is required');
  if (range && range.from > range.to) badRequest('dateFrom cannot be greater than dateTo');
}

const validateRequest = {
  HomeFact(req) { validateDateRange(req, true); },
  OverShootForCenters(req) { validateDateRange(req, false); },
  TokenGrossTare(req) { validateDateRange(req, false); },
  DailyRainfallData(req) { validateDateRange(req, false); },
  MonthlyEntryReportView(req) { validateDateRange(req, false); }
};

module.exports = { validateRequest };
