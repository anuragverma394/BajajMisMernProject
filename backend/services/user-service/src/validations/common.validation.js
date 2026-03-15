function asTrimmedString(value, max = 255) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  return text.slice(0, max);
}

function asId(value, max = 64) {
  const text = asTrimmedString(value, max);
  if (!text) return '';
  return /^[A-Za-z0-9_.\-]+$/.test(text) ? text : '';
}

function asPositiveInt(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.trunc(n);
}

function asBinaryFlag(value) {
  return String(value ?? '0') === '1' ? '1' : '0';
}

function parseJsonArray(raw, defaultValue = []) {
  if (raw == null) return defaultValue;
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : defaultValue;
  } catch (error) {
    return defaultValue;
  }
}

function parseCodeList(raw) {
  if (!raw) return [];
  const text = String(raw).trim();
  if (!text || text === '[]') return [];

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed
        .map((x) => asId(x))
        .filter(Boolean);
    }
  } catch (error) {
  }

  return text
    .replace(/[[\]{}"]/g, '')
    .split(',')
    .map((s) => asId(s.includes(':') ? s.split(':').pop() : s))
    .filter(Boolean);
}

module.exports = {
  asTrimmedString,
  asId,
  asPositiveInt,
  asBinaryFlag,
  parseJsonArray,
  parseCodeList
};
