const express = require('express');
const router = express.Router();
const admin = require('../controllers/adminController');
const { authAdmin, requireRole } = require('../middleware/auth');

const upload = require('../middleware/upload');
const { uploadImage } = require('../controllers/uploadController');

router.post('/login', admin.login);

router.use(authAdmin);
router.post('/upload', upload.single('file'), uploadImage);
router.get('/dashboard', admin.getDashboard);

router.get('/products', admin.adminGetProducts);
router.get('/products/search', admin.adminSearchProducts);
router.post('/products', admin.adminCreateProduct);
router.put('/products/:id', admin.adminUpdateProduct);
router.delete('/products/:id', admin.adminDeleteProduct);

router.get('/categories', admin.adminGetCategories);
router.post('/categories', admin.adminSaveCategory);

router.get('/orders', admin.adminGetOrders);
router.get('/orders/:id', admin.adminGetOrderDetail);
router.put('/orders/:id/status', admin.adminUpdateOrderStatus);

router.get('/users', admin.adminGetUsers);
router.get('/users/:id', admin.adminGetUserDetail);
router.put('/users/:id/status', admin.adminUpdateUserStatus);

router.get('/coupons', admin.adminGetCoupons);
router.post('/coupons', admin.adminSaveCoupon);

router.get('/stores', admin.adminGetStores);
router.post('/stores', admin.adminSaveStore);

router.get('/banners', admin.adminGetBanners);
router.post('/banners', admin.adminSaveBanner);
router.delete('/banners/:id', admin.adminDeleteBanner);

router.get('/home', admin.adminGetHome);
router.put('/home', admin.adminUpdateHomeSection);

router.get('/after-sales', admin.adminGetAfterSales);
router.put('/after-sales/:id', admin.adminHandleAfterSale);

router.get('/reviews', admin.adminGetReviews);
router.put('/reviews/:id/reply', admin.adminReplyReview);

module.exports = router;
