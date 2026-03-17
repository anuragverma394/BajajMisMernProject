const read = require('./tracking/tracking.read.controller');
const write = require('./tracking/tracking.write.controller');
const validation = require('./tracking/tracking.validation.controller');
const meta = require('./tracking/tracking.meta.controller');
const domain = require('./tracking/tracking.domain.controller');

module.exports = {
  ...read,
  ...write,
  ...validation,
  ...meta,
  ...domain
};
