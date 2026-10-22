const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const aiController = require('../controllers/aiController');

const router = express.Router();

router.use(requireAuth);
router.post('/assist', aiRateLimiter(), aiController.assist);
router.post('/document-chat', aiRateLimiter(), aiController.documentChat);

module.exports = router;
