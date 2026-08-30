const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');
const { authUser } = require('../middleware/auth');

router.post('/wx-login', auth.wxLogin);
router.get('/profile', authUser, auth.getProfile);
router.put('/profile', authUser, auth.updateProfile);
router.post('/bind-phone', authUser, auth.bindPhone);

module.exports = router;
