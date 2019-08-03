const express = require('express');
const router = express.Router();

const asyncRoute = route => (req, res, next = console.error) =>
  Promise.resolve(route(req, res)).catch(next);

// const checkAuth = require('../middleware/check-auth');
const nlpController = require('../controllers/nlp');

// router.put('/:id', checkAuth, nlpController.summaryCreate);
router.use('/summary', nlpController.nlp);

module.exports = asyncRoute(router);
// const express = require('express');
// const router = express.Router();
//
// const checkAuth = require('../middleware/check-auth');
// const postController = require('../controllers/post');
// const extractFile = require('../middleware/file');
//
// router.post('', checkAuth, extractFile, postController.postCreate);
// router.put('/:id', checkAuth, extractFile, postController.postEdit);
// router.get('', postController.postGet);
// router.get('/:id', postController.postGetOne);
// router.delete('/:id', checkAuth, postController.postDelete);
//
// module.exports = router;
