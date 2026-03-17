module.exports = {
  ...require('./report.read.repository'),
  ...require('./report.write.repository'),
  ...require('./report.validation.repository'),
  ...require('./report.domain.repository')
};
