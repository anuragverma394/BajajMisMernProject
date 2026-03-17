const read = require('./dashboard.read.repository');
const write = require('./dashboard.write.repository');
const validation = require('./dashboard.validation.repository');
const domain = require('./dashboard.domain.repository');

module.exports = {
  ...read,
  ...write,
  ...validation,
  ...domain
};
