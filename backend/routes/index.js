const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/documents', require('./documents'));
router.use('/bookmarks', require('./bookmarks'));
router.use('/notes', require('./notes'));
router.use('/ai', require('./ai'));

module.exports = router;
