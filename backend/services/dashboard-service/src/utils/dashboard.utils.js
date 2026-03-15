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

module.exports = {
  normalizeFactoryCodeList
};
