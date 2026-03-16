/**
 * Normalizes date input to DD/MM/YYYY format
 * @param {any} raw - Raw date input (string or Date object)
 * @returns {string} Normalized date in DD/MM/YYYY format or empty string
 */
function normalizeDateInput(raw) {
  const value = String(raw || '').trim();
  if (!value) return '';

  // Already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [yyyy, mm, dd] = value.split('-');
    return `${dd}/${mm}/${yyyy}`;
  }

  // Already in DD/MM/YYYY format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return value;
  }

  // DD-MM-YYYY format
  if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
    return value.replace(/-/g, '/');
  }

  // Try parsing as Date object
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '';
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const yyyy = dt.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Converts normalized date to SQL format (YYYY-MM-DD)
 * @param {any} raw - Raw date input
 * @returns {string} SQL formatted date or empty string
 */
function toSqlDate(raw) {
  const value = normalizeDateInput(raw);
  if (!value) return '';
  const [dd, mm, yyyy] = value.split('/');
  return `${yyyy}-${mm}-${dd}`;
}

module.exports = {
  normalizeDateInput,
  toSqlDate
};
