const userRead = require('./user/user.read.controller');
const userWrite = require('./user/user.write.controller');
const userValidation = require('./user/user.validation.controller');
const userMeta = require('./user/user.meta.controller');

const roleRead = require('./role/role.read.controller');
const roleWrite = require('./role/role.write.controller');
const roleMeta = require('./role/role.meta.controller');

const permissionRead = require('./permission/permission.read.controller');
const permissionWrite = require('./permission/permission.write.controller');
const permissionMeta = require('./permission/permission.meta.controller');

module.exports = {
  ...userRead,
  ...userWrite,
  ...userValidation,
  ...userMeta,
  ...roleRead,
  ...roleWrite,
  ...roleMeta,
  ...permissionRead,
  ...permissionWrite,
  ...permissionMeta
};
