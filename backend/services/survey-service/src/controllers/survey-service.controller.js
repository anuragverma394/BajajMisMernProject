const read = require('./survey-service/survey-service.read.controller');
const write = require('./survey-service/survey-service.write.controller');
const validation = require('./survey-service/survey-service.validation.controller');
const meta = require('./survey-service/survey-service.meta.controller');
const domain = require('./survey-service/survey-service.domain.controller');

module.exports = {
  ...read,
  ...write,
  ...validation,
  ...meta,
  ...domain
};
