const express = require('express');
const controller = require('../controllers/survey-service.controller');

const router = express.Router();

router.all('/', controller.index);

module.exports = router;
