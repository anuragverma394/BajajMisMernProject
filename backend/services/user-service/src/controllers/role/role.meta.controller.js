exports.AddRollView = (_req, res) => res.apiSuccess('Role metadata endpoint', {});
exports.AddRollID = (req, res) => res.apiSuccess('Role id payload', { sid: req.query.Rid || null });
