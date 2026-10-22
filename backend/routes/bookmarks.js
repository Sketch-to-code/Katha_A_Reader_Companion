const express = require('express');
const { requireAuth } = require('../middleware/auth');
const bookmarkController = require('../controllers/bookmarkController');

const router = express.Router();

router.use(requireAuth);
router.get('/', bookmarkController.list);
router.post('/', bookmarkController.create);
router.delete('/:id', bookmarkController.remove);

module.exports = router;
