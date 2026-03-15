const repository = require('../repositories/distillery.repository');

function createServiceError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function parseIsoDate(value) {
  const raw = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return null;
  }
  return raw;
}

function fiscalSeasonForDate(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return String(process.env.DEFAULT_SEASON || '2526');
  }

  const fiscalYear = date.getMonth() + 1 < 10 ? date.getFullYear() - 1 : date.getFullYear();
  const start = String(fiscalYear).slice(-2);
  const end = String(fiscalYear + 1).slice(-2);
  return `${start}${end}`;
}

function monthRange(fromDate, toDate) {
  const start = new Date(`${fromDate}T00:00:00`);
  const end = new Date(`${toDate}T00:00:00`);
  const ranges = [];

  for (let current = new Date(start.getFullYear(), start.getMonth(), 1); current <= end; current = new Date(current.getFullYear(), current.getMonth() + 1, 1)) {
    const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
    const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
    const from = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}-${String(monthStart.getDate()).padStart(2, '0')}`;
    const to = `${monthEnd.getFullYear()}-${String(monthEnd.getMonth() + 1).padStart(2, '0')}-${String(monthEnd.getDate()).padStart(2, '0')}`;
    const monthName = monthEnd.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    ranges.push({ from, to, monthName });
  }

  return ranges;
}

async function resolveDistilleryTable(season) {
  const candidates = ['Distillery_report', 'MI_Distillery_Report'];
  for (const tableName of candidates) {
    const objectId = await repository.getObjectId(tableName, season);
    if (objectId) {
      return tableName;
    }
  }
  return 'Distillery_report';
}

function buildRows(months, mappings, monthlyData) {
  return mappings.map((mapping) => ({
    Particular: mapping.label,
    UM: mapping.um,
    IsBold: Boolean(mapping.bold),
    IsDate: false,
    MonthlyValues: months.map((month) => ({
      MonthName: month.monthName,
      Value: Number(mapping.compute(monthlyData.get(month.monthName) || {}))
    }))
  }));
}

function numberField(name) {
  return (row) => Number(row?.[name] || 0);
}

function sumFields(...names) {
  return (row) => names.reduce((total, name) => total + Number(row?.[name] || 0), 0);
}

async function fetchMonthlyAggregate({ factoryCode, fromDate, toDate, columns }) {
  const season = fiscalSeasonForDate(fromDate);
  const tableName = await resolveDistilleryTable(season);
  return repository.getMonthlyAggregate({
    tableName,
    factoryCode,
    fromDate,
    toDate,
    columns,
    season
  });
}

async function buildReport({ factoryRaw, fromRaw, toRaw, columns, mappings }) {
  const fromDate = parseIsoDate(fromRaw);
  const toDate = parseIsoDate(toRaw);

  if (!fromDate || !toDate) {
    throw createServiceError('from and to dates are required in YYYY-MM-DD format', 400);
  }

  if (fromDate > toDate) {
    throw createServiceError('from date cannot be after to date', 400);
  }

  const factoryCode = factoryRaw && factoryRaw !== '0' ? Number(factoryRaw) : null;
  const months = monthRange(fromDate, toDate);
  const monthlyData = new Map();

  for (const month of months) {
    const data = await fetchMonthlyAggregate({
      factoryCode,
      fromDate: month.from,
      toDate: month.to,
      columns
    });
    monthlyData.set(month.monthName, data);
  }

  return buildRows(months, mappings, monthlyData);
}

module.exports = {
  numberField,
  sumFields,
  buildReport
};
