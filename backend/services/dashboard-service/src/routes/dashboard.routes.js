const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const controller = require('../controllers/dashboard.controller');

const router = express.Router();

router.use(requireAuth);
router.post('/marketing', controller.Marketing);

module.exports = router;

