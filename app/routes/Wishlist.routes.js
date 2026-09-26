const express = require('express');
const WishlistController = require('../controllers/Wishlist.controller');
const verifyToken = require('../middleware/Auth.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Wishlist
 *   description: User Product Wishlist Management APIs
 */

/**
 * @swagger
 * /api/wishlist:
 *   get:
 *     summary: Fetch current user wishlist items (Protected)
 *     tags: [Wishlist]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of wishlisted products
 */
router.get('/', verifyToken, WishlistController.getWishlist);

/**
 * @swagger
 * /api/wishlist/toggle:
 *   post:
 *     summary: Toggle product in wishlist (Add if not present, Remove if present)
 *     tags: [Wishlist]
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
 *             properties:
 *               productId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Toggled wishlist status
 */
router.post('/toggle', verifyToken, WishlistController.toggleWishlist);

module.exports = router;
