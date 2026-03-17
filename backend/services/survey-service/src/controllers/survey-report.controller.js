const read = require('./survey-report/survey-report.read.controller');
const write = require('./survey-report/survey-report.write.controller');
const validation = require('./survey-report/survey-report.validation.controller');
const meta = require('./survey-report/survey-report.meta.controller');
const domain = require('./survey-report/survey-report.domain.controller');

module.exports = {
  ...read,
  ...write,
  ...validation,
  ...meta,
  ...domain
};
