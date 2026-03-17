module.exports = {
  ...require('./new-report.read.repository'),
  ...require('./new-report.write.repository'),
  ...require('./new-report.validation.repository'),
  ...require('./new-report.domain.repository')
};
