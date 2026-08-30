const express = require('express');
const router = express.Router();
const address = require('../controllers/addressController');
const { authUser } = require('../middleware/auth');

router.use(authUser);
router.get('/', address.getAddresses);
router.post('/', address.createAddress);
router.put('/:id', address.updateAddress);
router.delete('/:id', address.deleteAddress);
router.put('/:id/default', address.setDefault);

module.exports = router;
