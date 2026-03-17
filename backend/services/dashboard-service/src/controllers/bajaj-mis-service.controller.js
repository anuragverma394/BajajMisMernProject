const read = require('./bajaj-mis-service/bajaj-mis-service.read.controller');
const write = require('./bajaj-mis-service/bajaj-mis-service.write.controller');
const validation = require('./bajaj-mis-service/bajaj-mis-service.validation.controller');
const meta = require('./bajaj-mis-service/bajaj-mis-service.meta.controller');
const domain = require('./bajaj-mis-service/bajaj-mis-service.domain.controller');

module.exports = {
  ...read,
  ...write,
  ...validation,
  ...meta,
  ...domain
};
