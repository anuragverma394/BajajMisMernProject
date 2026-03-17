const read = require('./survey-service.read.repository');
const write = require('./survey-service.write.repository');
const validation = require('./survey-service.validation.repository');
const domain = require('./survey-service.domain.repository');

module.exports = {
  ...read,
  ...write,
  ...validation,
  ...domain
};
