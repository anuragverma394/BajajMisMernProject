const { resolveDashboardRange } = require('./date.util');

function validateHomeFactRequest(body = {}, query = {}) {
  const range = resolveDashboardRange(body, query);
  if (!range) {
    return {
      ok: false,
      message: 'dateFrom and dateTo (YYYY-MM-DD) or txtdaterange is required'
    };
  }

  if (range.from > range.to) {
    return {
      ok: false,
      message: 'dateFrom cannot be greater than dateTo'
    };
  }

  const F_Code = String(body.F_Code || query.F_Code || body.factoryCode || query.factoryCode || '').trim();
  return { ok: true, range, F_Code };
}

function normalizeFactoryCodeList(value) {
  const raw = String(value || '').trim();
  if (!raw || raw === '0') return '';
  const compact = raw.replace(/\s+/g, '');
  if (!/^\d+(,\d+)*$/.test(compact)) return '';
  return compact
    .split(',')
    .filter(Boolean)
    .map((v) => String(Number(v)))
    .join(',');
}

function isTimeoutError(error) {
  const message = String(error?.message || '');
  return (error?.code === 'EREQUEST' && /timeout expired/i.test(message))
    || /operation timed out/i.test(message);
}

module.exports = {
  validateHomeFactRequest,
  normalizeFactoryCodeList,
  isTimeoutError
};
