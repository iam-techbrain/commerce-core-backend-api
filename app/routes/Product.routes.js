const express = require('express');
const ProductController = require('../controllers/Product.controller');
const { upload, uploadExcel } = require('../middleware/Upload.middleware');
const verifyToken = require('../middleware/Auth.middleware');

const router = express.Router();

// Download Sample Excel Template
router.get('/sample-template', ProductController.getSampleTemplate);

// Bulk Upload Products via Excel / CSV (Max 50 products per batch, Protected)
router.post('/bulk-upload', verifyToken, uploadExcel.single('file'), ProductController.bulkUpload);

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product Management APIs (with PAGINATION, Low Stock Alerts & Image Upload)
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Fetch products with PAGINATION, Search, Filter & Sorting
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Paginated list of products with pagination metadata
 */
router.get('/', ProductController.getAll);

/**
 * @swagger
 * /api/products/low-stock:
 *   get:
 *     summary: Fetch low stock products (Protected - Stock <= 5)
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: Low stock products list
 */
router.get('/low-stock', verifyToken, ProductController.getLowStockProducts);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Fetch product details by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product details
 */
router.get('/:id', ProductController.getById);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Add a new product (Protected, Image Upload & Orphan Cleanup)
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *               sku:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               categoryId:
 *                 type: integer
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Product created successfully
 */
router.post('/', verifyToken, upload.product.single('image'), ProductController.create);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update an existing product (Protected, Image Upload Supported)
 *     tags: [Products]
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
 *               sku:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               categoryId:
 *                 type: integer
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Product updated successfully
 */
router.put('/:id', verifyToken, upload.product.single('image'), ProductController.update);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete a product (Protected)
 *     tags: [Products]
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
 *         description: Product deleted successfully
 */
router.delete('/:id', verifyToken, ProductController.delete);

// Variant Management Endpoints (Protected)
router.post('/:id/variants', verifyToken, ProductController.addVariant);
router.put('/variants/:variantId', verifyToken, ProductController.updateVariant);
router.delete('/variants/:variantId', verifyToken, ProductController.deleteVariant);

module.exports = router;
