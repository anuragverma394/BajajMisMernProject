function parseNumericCsvCodes(codesCsv) {
  if (!codesCsv) return [];
  return String(codesCsv)
    .split(',')
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n > 0 && n <= 2147483647);
}

function buildParametrizedInClause(columnExpr, codesCsv, params, keyPrefix = 'f') {
  const numbers = Array.from(new Set(parseNumericCsvCodes(codesCsv)));
  if (!numbers.length) return '';
  const placeholders = [];
  numbers.forEach((num, i) => {
    const key = `${keyPrefix}${i}`;
    params[key] = num;
    placeholders.push(`@${key}`);
  });
  return ` AND ${columnExpr} IN (${placeholders.join(',')})`;
}

function quoteSqlIdentifier(identifier) {
  const raw = String(identifier || '').trim();
  if (!raw || raw.length > 128 || raw.includes('\0') || raw.includes('.')) {
    throw new Error('Invalid SQL identifier');
  }
  return `[${raw.replace(/]/g, ']]')}]`;
}

function quoteSqlObjectName(name) {
  const raw = String(name || '').trim();
  if (!raw) {
    throw new Error('Invalid SQL object name');
  }
  const parts = raw.split('.').map((p) => p.trim()).filter(Boolean);
  if (!parts.length || parts.some((p) => p.length > 128 || p.includes('\0'))) {
    throw new Error('Invalid SQL object name');
  }
  return parts.map((p) => `[${p.replace(/]/g, ']]')}]`).join('.');
}

module.exports = {
  buildParametrizedInClause,
  quoteSqlIdentifier,
  quoteSqlObjectName
};
