const express = require('express');
const router = express.Router();
const pay = require('../controllers/payController');
const { authUser } = require('../middleware/auth');

router.post('/:orderId', authUser, pay.createPayment);
router.post('/:orderId/mock', authUser, pay.mockPay);
router.post('/notify', pay.payNotify);

module.exports = router;
