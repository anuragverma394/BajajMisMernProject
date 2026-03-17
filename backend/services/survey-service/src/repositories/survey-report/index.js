const read = require('./survey-report.read.repository');
const write = require('./survey-report.write.repository');
const validation = require('./survey-report.validation.repository');
const domain = require('./survey-report.domain.repository');

module.exports = {
  ...read,
  ...write,
  ...validation,
  ...domain
};
