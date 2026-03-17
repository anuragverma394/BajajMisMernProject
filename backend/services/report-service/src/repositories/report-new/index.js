module.exports = {
  ...require('./report-new.read.repository'),
  ...require('./report-new.write.repository'),
  ...require('./report-new.validation.repository'),
  ...require('./report-new.domain.repository')
};
