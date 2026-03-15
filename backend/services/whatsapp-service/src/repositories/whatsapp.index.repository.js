const metrics = require('./domains/dashboard-metrics.repository');
const masters = require('./domains/masters.repository');
const reports = require('./domains/whatsapp-report.repository');
const ops = require('./domains/ops.repository');

module.exports = {
  ...metrics,
  ...masters,
  ...reports,
  ...ops
};
