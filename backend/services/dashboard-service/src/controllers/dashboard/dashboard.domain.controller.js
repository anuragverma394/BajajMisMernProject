const mainController = require('../main.controller');

exports.Marketing = async (req, res, next) => {
  req.body = {
    ...req.body,
    Type: req.body?.Type || 'marketing'
  };
  return mainController.HomeFact(req, res, next);
};

