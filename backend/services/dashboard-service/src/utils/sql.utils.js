function isNumericCsv(value) {
  const raw = String(value || '').trim();
  if (!raw) return true;
  return /^\d+(,\d+)*$/.test(raw.replace(/\s+/g, ''));
}

module.exports = { isNumericCsv };
