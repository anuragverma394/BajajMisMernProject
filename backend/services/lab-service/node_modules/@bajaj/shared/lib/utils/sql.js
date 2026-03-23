/**
 * Shared SQL Utility Functions for safe query building
 */

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

function buildMappedExpr({ tableAlias = 'd', column, alias, numeric = false }) {
  if (!column) {
    return numeric ? `0 AS ${alias}` : `'' AS ${alias}`;
  }
  return numeric
    ? `ISNULL(${tableAlias}.${column}, 0) AS ${alias}`
    : `ISNULL(${tableAlias}.${column}, '') AS ${alias}`;
}

module.exports = {
  quoteSqlIdentifier,
  quoteSqlObjectName,
  parseNumericCsvCodes,
  buildParametrizedInClause,
  buildMappedExpr
};
