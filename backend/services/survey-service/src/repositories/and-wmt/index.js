const read = require('./and-wmt.read.repository');
const write = require('./and-wmt.write.repository');
const validation = require('./and-wmt.validation.repository');
const domain = require('./and-wmt.domain.repository');

module.exports = {
  ...read,
  ...write,
  ...validation,
  ...domain
};
