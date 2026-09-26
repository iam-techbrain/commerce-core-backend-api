const express = require('express');
const ReviewController = require('../controllers/Review.controller');
const verifyToken = require('../middleware/Auth.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Product Ratings & Customer Reviews APIs
 */

/**
 * @swagger
 * /api/reviews/product/{productId}:
 *   get:
 *     summary: Fetch reviews and average rating for a product
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of product reviews and average rating
 */
router.get('/product/:productId', ReviewController.getProductReviews);

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Add or Update rating & review for a product (Protected)
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - rating
 *             properties:
 *               productId:
 *                 type: integer
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               comment:
 *                 type: string
 *                 example: Excellent quality product! Loved it.
 *     responses:
 *       201:
 *         description: Review submitted successfully
 */
router.post('/', verifyToken, ReviewController.addReview);

/**
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     summary: Delete a review (Protected)
 *     tags: [Reviews]
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
 *         description: Review deleted
 */
router.delete('/:id', verifyToken, ReviewController.deleteReview);

module.exports = router;
