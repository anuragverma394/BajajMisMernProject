module.exports = {
  ...require('./user/user.read.controller'),
  ...require('./user/user.write.controller'),
  ...require('./user/user.validation.controller'),
  ...require('./user/user.meta.controller')
};
