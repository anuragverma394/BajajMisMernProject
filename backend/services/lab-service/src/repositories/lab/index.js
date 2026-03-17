const read = require('./lab.read.repository');
const write = require('./lab.write.repository');
const validation = require('./lab.validation.repository');
const domain = require('./lab.domain.repository');

module.exports = {
  ...read,
  ...write,
  ...validation,
  ...domain
};
