const read = require('./whats-app/whats-app.read.controller');
const write = require('./whats-app/whats-app.write.controller');
const validation = require('./whats-app/whats-app.validation.controller');
const meta = require('./whats-app/whats-app.meta.controller');
const domain = require('./whats-app/whats-app.domain.controller');

module.exports = {
  ...read,
  ...write,
  ...validation,
  ...meta,
  ...domain
};
