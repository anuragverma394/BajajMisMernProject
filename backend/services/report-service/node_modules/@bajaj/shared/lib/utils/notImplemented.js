function createNotImplementedHandler(controller, action, signature) {
  return async function notImplemented(req, res) {
    return res.status(501).json({
      success: false,
      message: `${controller}.${action} is not implemented in this microservice`,
      data: {
        controller,
        action,
        signature
      }
    });
  };
}

module.exports = {
  createNotImplementedHandler
};
