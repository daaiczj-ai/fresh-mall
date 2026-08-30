const express = require('express');
const router = express.Router();
const product = require('../controllers/productController');
const { authUser, optionalAuth } = require('../middleware/auth');

router.get('/banners', product.getBanners);
router.get('/categories', product.getCategories);
router.get('/products', product.getProducts);
router.get('/products/:id', optionalAuth, product.getProductDetail);
router.get('/search', product.searchProducts);
router.get('/seckills', product.getSeckills);
router.get('/frequently-bought', authUser, product.getFrequentlyBought);

module.exports = router;
