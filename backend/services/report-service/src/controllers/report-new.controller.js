const read = require('./report-new/report-new.read.controller');
const write = require('./report-new/report-new.write.controller');
const validation = require('./report-new/report-new.validation.controller');
const meta = require('./report-new/report-new.meta.controller');
const domain = require('./report-new/report-new.domain.controller');

module.exports = {
  ...read,
  ...write,
  ...validation,
  ...meta,
  ...domain
};
