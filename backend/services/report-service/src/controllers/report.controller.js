const read = require('./report/report.read.controller');
const write = require('./report/report.write.controller');
const validation = require('./report/report.validation.controller');
const meta = require('./report/report.meta.controller');
const domain = require('./report/report.domain.controller');

module.exports = {
  ...read,
  ...write,
  ...validation,
  ...meta,
  ...domain
};
