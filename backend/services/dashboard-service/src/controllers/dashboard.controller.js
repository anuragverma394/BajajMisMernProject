const read = require('./dashboard/dashboard.read.controller');
const write = require('./dashboard/dashboard.write.controller');
const validation = require('./dashboard/dashboard.validation.controller');
const meta = require('./dashboard/dashboard.meta.controller');
const domain = require('./dashboard/dashboard.domain.controller');

module.exports = {
  ...read,
  ...write,
  ...validation,
  ...meta,
  ...domain
};
