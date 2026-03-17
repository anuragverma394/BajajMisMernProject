module.exports = {
  ...require('./permission.read.repository'),
  ...require('./permission.write.repository'),
  ...require('./permission.validation.repository'),
  ...require('./permission.domain.repository')
};
