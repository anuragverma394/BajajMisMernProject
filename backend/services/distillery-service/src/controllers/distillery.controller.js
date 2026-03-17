const read = require('./distillery/distillery.read.controller');
const write = require('./distillery/distillery.write.controller');
const validation = require('./distillery/distillery.validation.controller');
const meta = require('./distillery/distillery.meta.controller');
const domain = require('./distillery/distillery.domain.controller');

module.exports = {
  ...read,
  ...write,
  ...validation,
  ...meta,
  ...domain
};
