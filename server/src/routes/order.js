const express = require('express');
const router = express.Router();
const order = require('../controllers/orderController');
const { authUser } = require('../middleware/auth');

router.use(authUser);
router.post('/preview', order.preview);
router.post('/', order.create);
router.get('/', order.getOrders);
router.get('/:id', order.getOrderDetail);
router.post('/:id/cancel', order.cancelOrder);
router.post('/:id/confirm', order.confirmReceive);

module.exports = router;
