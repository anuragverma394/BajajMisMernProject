module.exports = {
  ...require('./permission/permission.read.controller'),
  ...require('./permission/permission.write.controller'),
  ...require('./permission/permission.meta.controller')
};
