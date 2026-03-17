const read = require('./main.read.repository');
const write = require('./main.write.repository');
const validation = require('./main.validation.repository');
const domain = require('./main.domain.repository');

module.exports = {
  ...read,
  ...write,
  ...validation,
  ...domain
};
