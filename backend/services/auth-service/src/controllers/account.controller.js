const read = require('./account/account.read.controller');
const write = require('./account/account.write.controller');
const validation = require('./account/account.validation.controller');
const meta = require('./account/account.meta.controller');
const domain = require('./account/account.domain.controller');

module.exports = {
  ...read,
  ...write,
  ...validation,
  ...meta,
  ...domain
};
