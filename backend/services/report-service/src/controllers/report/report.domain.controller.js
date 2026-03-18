const legacy = require('../../repositories/report/report.domain.repository');
const refactor = require('../../report.controller');

module.exports = {
  ...legacy,
  DriageSummary: refactor.DriageSummary,
  DriageDetail: refactor.DriageDetail,
  DriageClerkSummary: refactor.DriageClerkSummary
};
