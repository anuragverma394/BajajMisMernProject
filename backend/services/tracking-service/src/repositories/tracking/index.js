const read = require('./tracking.read.repository');
const write = require('./tracking.write.repository');
const validation = require('./tracking.validation.repository');
const domain = require('./tracking.domain.repository');

module.exports = {
  ...read,
  ...write,
  ...validation,
  ...domain
};
