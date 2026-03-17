const read = require('./lab/lab.read.controller');
const write = require('./lab/lab.write.controller');
const validation = require('./lab/lab.validation.controller');
const meta = require('./lab/lab.meta.controller');
const domain = require('./lab/lab.domain.controller');

module.exports = {
  ...read,
  ...write,
  ...validation,
  ...meta,
  ...domain
};
