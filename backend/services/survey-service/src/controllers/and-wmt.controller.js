const read = require('./and-wmt/and-wmt.read.controller');
const write = require('./and-wmt/and-wmt.write.controller');
const validation = require('./and-wmt/and-wmt.validation.controller');
const meta = require('./and-wmt/and-wmt.meta.controller');
const domain = require('./and-wmt/and-wmt.domain.controller');

module.exports = {
  ...read,
  ...write,
  ...validation,
  ...meta,
  ...domain
};
