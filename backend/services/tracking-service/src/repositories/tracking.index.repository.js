const master = require('./domains/tracking-master.repository');
const target = require('./domains/tracking-target.repository');
const live = require('./domains/tracking-live.repository');
const report = require('./domains/tracking-report.repository');

module.exports = {
  ...master,
  ...target,
  ...live,
  ...report
};
