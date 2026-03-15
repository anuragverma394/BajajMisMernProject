const userController = require('./user.controller');
const roleController = require('./role.controller');
const permissionController = require('./permission.controller');

module.exports = {
  ...userController,
  ...roleController,
  ...permissionController
};
