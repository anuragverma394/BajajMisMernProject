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

function resolveDateRangeFromRequest(req) {
  const b = req?.body || {};
  const q = req?.query || {};
  const txt = String(b.txtdaterange || q.txtdaterange || '').trim();
  const fromDate = parseIsoDate(b.dateFrom || b.fromDate || q.dateFrom || q.fromDate);
  const toDate = parseIsoDate(b.dateTo || b.toDate || q.dateTo || q.toDate);
  if (txt) {
    const parsed = parseDateRangeText(txt);
    if (parsed) return parsed;
  }
  if (fromDate && toDate) return { from: fromDate, to: toDate };
  return null;
}

module.exports = {
  parseIsoDate,
  parseDateRangeText,
  resolveDateRangeFromRequest
};
