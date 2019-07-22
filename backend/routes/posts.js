const express = require('express');
const router = express.Router();

const checkAuth = require('../middleware/check-auth');
const postController = require('../controllers/post');
const extractFile = require('../middleware/file');

router.post('', checkAuth, extractFile, postController.postCreate);
router.put('/:id', checkAuth, extractFile, postController.postEdit);
router.get('', postController.postGet);
router.get('/:id', postController.postGetOne);
router.delete('/:id', checkAuth, postController.postDelete);

module.exports = router;
