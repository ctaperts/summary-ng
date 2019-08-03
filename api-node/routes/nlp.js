const express = require('express');
const router = express.Router();

// const checkAuth = require('../middleware/check-auth');
//
const nlpController = require('../controllers/nlp');

// router.put('/:id', checkAuth, nlpController.summaryCreate);
router.use('/summary', nlpController.nlp);

module.exports = router;
