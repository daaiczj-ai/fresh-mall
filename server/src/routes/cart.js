const express = require('express');
const router = express.Router();
const cart = require('../controllers/cartController');
const { authUser } = require('../middleware/auth');

router.use(authUser);
router.get('/', cart.getCart);
router.post('/', cart.addToCart);
router.put('/:id', cart.updateCart);
router.delete('/:id', cart.removeFromCart);
router.delete('/', cart.clearCart);
router.put('/select/all', cart.selectAll);

module.exports = router;
