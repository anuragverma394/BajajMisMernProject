module.exports = {
  ...require('./account-reports.read.repository'),
  ...require('./account-reports.write.repository'),
  ...require('./account-reports.validation.repository'),
  ...require('./account-reports.domain.repository')
};
