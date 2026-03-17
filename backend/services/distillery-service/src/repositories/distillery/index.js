const read = require('./distillery.read.repository');
const write = require('./distillery.write.repository');
const validation = require('./distillery.validation.repository');
const domain = require('./distillery.domain.repository');

module.exports = {
  ...read,
  ...write,
  ...validation,
  ...domain
};
