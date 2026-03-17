exports.AddUserView = (_req, res) => res.apiSuccess('User API metadata', { action: 'add-user-view' });
exports.AddUser = (_req, res) => res.apiSuccess('User API metadata', { action: 'add-user' });
exports.AddUserByID = (req, res) => res.apiSuccess('User id payload', { sid: req.query.Rid || null });
exports.LabModulePermision = (_req, res) => res.apiSuccess('Lab permission endpoint available', {});
