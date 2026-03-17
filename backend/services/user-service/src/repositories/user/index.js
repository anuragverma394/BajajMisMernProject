module.exports = {
  ...require('./user.read.repository'),
  ...require('./user.write.repository'),
  ...require('./user.validation.repository'),
  ...require('./user.domain.repository')
};
