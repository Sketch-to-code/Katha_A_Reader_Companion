const express = require('express');
const authController = require('../controllers/authController');
const { emailAuthRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/register', emailAuthRateLimiter(), authController.register);
router.post('/login', authController.login);
router.post('/email-login', emailAuthRateLimiter(), authController.emailLogin);
router.post('/verify-email', emailAuthRateLimiter(), authController.verifyEmailLogin);

module.exports = router;
