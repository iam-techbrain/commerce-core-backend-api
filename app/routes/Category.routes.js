const express = require('express');
const CategoryController = require('../controllers/Category.controller');
const upload = require('../middleware/Upload.middleware');
const verifyToken = require('../middleware/Auth.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Category Management APIs (with Image Upload & Product Constraint Check)
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Fetch all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of categories with product counts
 */
router.get('/', CategoryController.getAll);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Fetch category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Category details with associated products
 */
router.get('/:id', CategoryController.getById);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Add a new category (Protected, Image Upload Supported)
 *     tags: [Categories]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Category created successfully
 */
router.post('/', verifyToken, upload.category.single('image'), CategoryController.create);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Update an existing category (Protected, Image Upload Supported)
 *     tags: [Categories]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Category updated successfully
 */
router.put('/:id', verifyToken, upload.category.single('image'), CategoryController.update);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete a category (Protected - Fails if Products exist in this category)
 *     tags: [Categories]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       400:
 *         description: Cannot delete category! Products exist in this category.
 */
router.delete('/:id', verifyToken, CategoryController.delete);

module.exports = router;
