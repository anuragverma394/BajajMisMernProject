module.exports = {
  ...require('./role.read.repository'),
  ...require('./role.write.repository'),
  ...require('./role.validation.repository'),
  ...require('./role.domain.repository')
};
