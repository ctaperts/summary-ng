const express = require('express');
const router = express.Router();

const checkAuth = require('../middleware/check-auth');
const summaryController = require('../controllers/summary');

router.put('/:id', checkAuth, summaryController.summaryCreate);
// router.get('/:id', summaryController.summaryGetOne);
// router.delete('/:id', checkAuth, summaryController.summaryDelete);

module.exports = router;
