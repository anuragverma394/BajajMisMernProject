module.exports = {
  ...require('./role/role.read.controller'),
  ...require('./role/role.write.controller'),
  ...require('./role/role.meta.controller')
};
