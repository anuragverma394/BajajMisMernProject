module.exports = {
  ...require('./auth.read.repository'),
  ...require('./auth.write.repository'),
  ...require('./auth.validation.repository'),
  ...require('./auth.domain.repository')
};
