const express = require('express');
const BrandController = require('../controllers/Brand.controller');
const upload = require('../middleware/Upload.middleware');
const verifyToken = require('../middleware/Auth.middleware');

const router = express.Router();

router.get('/', BrandController.getAll);
router.get('/:id', BrandController.getById);
router.post('/', verifyToken, upload.single('logo'), BrandController.create);
router.put('/:id', verifyToken, upload.single('logo'), BrandController.update);
router.delete('/:id', verifyToken, BrandController.delete);

module.exports = router;
