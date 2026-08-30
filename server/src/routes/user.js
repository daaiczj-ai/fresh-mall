const express = require('express');
const router = express.Router();
const user = require('../controllers/userController');
const { authUser } = require('../middleware/auth');

router.get('/stores', user.getStores);
router.get('/coupons/available', authUser, user.getAvailableCoupons);
router.post('/coupons/:id/receive', authUser, user.receiveCoupon);
router.get('/coupons', authUser, user.getMyCoupons);
router.get('/member', authUser, user.getMemberInfo);
router.get('/points', authUser, user.getPointsLog);
router.get('/favorites', authUser, user.getFavorites);
router.post('/favorites', authUser, user.toggleFavorite);
router.post('/reviews', authUser, user.createReview);
router.get('/reviews', user.getProductReviews);
router.post('/after-sales', authUser, user.createAfterSale);
router.get('/after-sales', authUser, user.getAfterSales);

module.exports = router;
