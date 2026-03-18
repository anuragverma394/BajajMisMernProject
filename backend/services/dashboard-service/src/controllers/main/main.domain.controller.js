const legacy = require('../../repositories/main');
const dashboardController = require('../dashboard.controller');

module.exports = {
  ...legacy,
  HomeFact: dashboardController.HomeFact
};
