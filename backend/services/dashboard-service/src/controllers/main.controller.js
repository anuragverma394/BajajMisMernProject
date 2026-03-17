const read = require('./main/main.read.controller');
const write = require('./main/main.write.controller');
const validation = require('./main/main.validation.controller');
const meta = require('./main/main.meta.controller');
const domain = require('./main/main.domain.controller');

module.exports = {
  ...read,
  ...write,
  ...validation,
  ...meta,
  ...domain
};
