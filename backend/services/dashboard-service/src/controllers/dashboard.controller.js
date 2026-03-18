const { catchAsync } = require('@bajaj/shared');
const dashboardService = require('../services/dashboard.service');

// Legacy HomeFact logic remains in main.domain.repository.js for safe rollback.
exports.HomeFact = catchAsync(async (req, res, next) => {
  try {
    const result = await dashboardService.getHomeFact({ req });
    return res.status(result.status || 200).json(result.payload);
  } catch (error) {
    if (dashboardService.isTimeoutError && dashboardService.isTimeoutError(error)) {
      return res.status(200).json({ MyList: [], DateList: [] });
    }
    return next(error);
  }
});

// Backward compatibility for dashboard.routes.js without circular imports
exports.Marketing = catchAsync(async (req, res, next) => {
  req.body = {
    ...req.body,
    Type: req.body?.Type || 'marketing'
  };
  return exports.HomeFact(req, res, next);
});
