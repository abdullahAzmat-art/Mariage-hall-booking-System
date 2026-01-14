const express = require('express');
const router = express.Router();
const { getExamples, createExample } = require('../controllers/exampleController');

router.route('/').get(getExamples).post(createExample);

module.exports = router;
