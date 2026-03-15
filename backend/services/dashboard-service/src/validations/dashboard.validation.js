const { resolveDateRangeFromRequest } = require('../utils/date.utils');
const { isNumericCsv } = require('../utils/sql.utils');

function badRequest(message) {
  const err = new Error(message);
  err.statusCode = 400;
  throw err;
}

function validateFactoryCode(req) {
  const raw = String(req?.body?.F_Code || req?.query?.F_Code || req?.body?.factoryCode || req?.query?.factoryCode || '').trim();
  if (!isNumericCsv(raw)) badRequest('F_Code must be a comma-separated numeric list (example: "50,51")');
}

function validateDateRange(req, { required = false } = {}) {
  const range = resolveDateRangeFromRequest(req);
  if (!range && required) badRequest('dateFrom and dateTo (YYYY-MM-DD) or txtdaterange is required');
  if (range && range.from > range.to) badRequest('dateFrom cannot be greater than dateTo');
}

const validateRequest = {
  HomeFact(req) {
    validateDateRange(req, { required: true });
    validateFactoryCode(req);
  },
  OverShootForCenters(req) {
    validateDateRange(req, { required: false });
    validateFactoryCode(req);
  },
  TokenGrossTare(req) {
    validateDateRange(req, { required: false });
    validateFactoryCode(req);
  },
  SugarWhatsAppReportView(req) {
    validateDateRange(req, { required: false });
  },
  DailyRainfallData(req) {
    validateDateRange(req, { required: false });
  },
  MonthlyEntryReportView(req) {
    validateDateRange(req, { required: false });
  }
};

module.exports = { validateRequest };
