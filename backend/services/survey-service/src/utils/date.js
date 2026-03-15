function parseDDMMYYYY(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const iso = `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  const check = new Date(`${iso}T00:00:00Z`);

  if (Number.isNaN(check.getTime())) {
    return null;
  }

  return iso;
}

module.exports = {
  parseDDMMYYYY
};
