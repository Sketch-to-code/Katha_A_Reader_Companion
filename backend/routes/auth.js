const express = require('express');
const authController = require('../controllers/authController');
const { emailAuthRateLimiter } = require('../middleware/rateLimiter');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', emailAuthRateLimiter(), authController.register);
router.post('/login', emailAuthRateLimiter(), authController.login);
router.post('/email-login', emailAuthRateLimiter(), authController.emailLogin);
router.post('/verify-email', emailAuthRateLimiter(), authController.verifyEmailLogin);
router.patch('/profile', requireAuth, authController.updateProfile);
router.post('/change-password', requireAuth, authController.changePassword);

module.exports = router;
