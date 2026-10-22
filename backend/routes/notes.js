const express = require('express');
const { requireAuth } = require('../middleware/auth');
const noteController = require('../controllers/noteController');

const router = express.Router();

router.use(requireAuth);
router.get('/', noteController.list);
router.post('/', noteController.create);
router.patch('/:id', noteController.update);
router.delete('/:id', noteController.remove);

module.exports = router;
