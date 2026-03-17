const read = require('./account-reports/account-reports.read.controller');
const write = require('./account-reports/account-reports.write.controller');
const validation = require('./account-reports/account-reports.validation.controller');
const meta = require('./account-reports/account-reports.meta.controller');
const domain = require('./account-reports/account-reports.domain.controller');

module.exports = {
  ...read,
  ...write,
  ...validation,
  ...meta,
  ...domain
};
