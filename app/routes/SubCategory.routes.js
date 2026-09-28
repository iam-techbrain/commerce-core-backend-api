const express = require('express');
const SubCategoryController = require('../controllers/SubCategory.controller');
const upload = require('../middleware/Upload.middleware');
const verifyToken = require('../middleware/Auth.middleware');

const router = express.Router();

router.get('/', SubCategoryController.getAll);
router.get('/:id', SubCategoryController.getById);
router.post('/', verifyToken, upload.single('image'), SubCategoryController.create);
router.put('/:id', verifyToken, upload.single('image'), SubCategoryController.update);
router.delete('/:id', verifyToken, SubCategoryController.delete);

module.exports = router;
