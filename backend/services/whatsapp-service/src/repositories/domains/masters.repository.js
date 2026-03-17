const repository = require('../main');

const createSeason = repository.AddSeason_2;
const updateSeason = repository.AddSeason_2;
const createModeGroup = repository.AddModeGroup_2;
const updateModeGroup = repository.AddModeGroup_2;
const createStopage = repository.AddStopage_2;
const updateStopage = repository.AddStopage_2;

module.exports = {
  createSeason,
  updateSeason,
  createModeGroup,
  updateModeGroup,
  createStopage,
  updateStopage,
  AddSeason: repository.AddSeason,
  AddSeason_2: repository.AddSeason_2,
  AddSeasonView: repository.AddSeasonView,
  AddSeasonByID: repository.AddSeasonByID,
  AddModeGroup: repository.AddModeGroup,
  AddModeGroup_2: repository.AddModeGroup_2,
  AddModeGroupView: repository.AddModeGroupView,
  AddModeGroupViewID: repository.AddModeGroupViewID,
  AddStopage: repository.AddStopage,
  AddStopage_2: repository.AddStopage_2,
  AddStopageView: repository.AddStopageView,
  AddStopageID: repository.AddStopageID
};
