const read = require('./new-report/new-report.read.controller');
const write = require('./new-report/new-report.write.controller');
const validation = require('./new-report/new-report.validation.controller');
const meta = require('./new-report/new-report.meta.controller');
const domain = require('./new-report/new-report.domain.controller');

module.exports = {
  ...read,
  ...write,
  ...validation,
  ...meta,
  ...domain
};
