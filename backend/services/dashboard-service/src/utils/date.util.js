function toIsoFromDDMMYYYY(value) {
  const m = String(value || '').match(/^(\d{2})[-\/](\d{2})[-\/](\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function parseDateRange(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;

  const parts = raw.split(' - ').map((v) => v.trim()).filter(Boolean);
  if (parts.length === 2) {
    const from = toIsoFromDDMMYYYY(parts[0]) || parts[0];
    const to = toIsoFromDDMMYYYY(parts[1]) || parts[1];
    if (/^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
      return { from, to };
    }
    return null;
  }

  const singleIso = raw.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (singleIso) {
    return { from: singleIso[1], to: singleIso[1] };
  }

  const singleDDMMYYYY = toIsoFromDDMMYYYY(raw);
  if (singleDDMMYYYY) {
    return { from: singleDDMMYYYY, to: singleDDMMYYYY };
  }

  return null;
}

function parseIsoDate(value) {
  const raw = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return null;
  }
  return raw;
}

function resolveDashboardRange(body = {}, query = {}) {
  const txtdaterange = String(body.txtdaterange || query.txtdaterange || '').trim();
  if (txtdaterange) {
    return parseDateRange(txtdaterange);
  }

  const fromDate = parseIsoDate(body.dateFrom || body.fromDate || query.dateFrom || query.fromDate);
  const toDate = parseIsoDate(body.dateTo || body.toDate || query.dateTo || query.toDate);
  if (!fromDate || !toDate) {
    return null;
  }

  return { from: fromDate, to: toDate };
}

function buildDateLabels(fromIso, toIso) {
  const labels = [];
  const from = new Date(`${fromIso}T00:00:00`);
  const to = new Date(`${toIso}T00:00:00`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    return labels;
  }

  for (const d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    labels.push(`${dd}-${mm}-${yyyy}`);
  }
  return labels;
}

function daysBetweenInclusive(fromIso, toIso) {
  const from = new Date(`${fromIso}T00:00:00`);
  const to = new Date(`${toIso}T00:00:00`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    return 0;
  }
  const diffMs = to.getTime() - from.getTime();
  return Math.floor(diffMs / 86400000) + 1;
}

function splitDateRange(fromIso, toIso, chunkDays = 60) {
  const ranges = [];
  const from = new Date(`${fromIso}T00:00:00`);
  const to = new Date(`${toIso}T00:00:00`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    return ranges;
  }

  const safeChunk = Math.max(1, Number(chunkDays) || 60);
  let cursor = new Date(from);
  while (cursor <= to) {
    const end = new Date(cursor);
    end.setDate(end.getDate() + safeChunk - 1);
    if (end > to) end.setTime(to.getTime());
    ranges.push({
      from: end.toISOString().slice(0, 10),
      to: end.toISOString().slice(0, 10)
    });
    cursor.setDate(cursor.getDate() + safeChunk);
  }
  return ranges;
}

function toDDMMYYYY(value) {
  const isoDate = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDate) {
    return `${isoDate[3]}-${isoDate[2]}-${isoDate[1]}`;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function parseFlexibleDateToIso(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const ddmmyyyy = raw.match(/^(\d{2})[-\/](\d{2})[-\/](\d{4})$/);
  if (ddmmyyyy) return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;
  return null;
}

function addDaysIso(isoDate, deltaDays) {
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  d.setDate(d.getDate() + Number(deltaDays || 0));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

module.exports = {
  toIsoFromDDMMYYYY,
  parseDateRange,
  parseIsoDate,
  resolveDashboardRange,
  buildDateLabels,
  daysBetweenInclusive,
  splitDateRange,
  toDDMMYYYY,
  parseFlexibleDateToIso,
  addDaysIso
};
