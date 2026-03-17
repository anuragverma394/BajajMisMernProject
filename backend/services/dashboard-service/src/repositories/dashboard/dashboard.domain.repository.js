const dashboardMetrics = require('../domains/dashboard-metrics.repository');
const seasonMode = require('../domains/season-mode.repository');
const stoppage = require('../domains/stoppage.repository');
const whatsapp = require('../domains/whatsapp.repository');
const distilleryEntry = require('../domains/distillery-entry.repository');
const rainfall = require('../domains/rainfall.repository');
const monthlyTarget = require('../domains/monthly-target.repository');

module.exports = {
  ...dashboardMetrics,
  ...seasonMode,
  ...stoppage,
  ...whatsapp,
  ...distilleryEntry,
  ...rainfall,
  ...monthlyTarget
};
