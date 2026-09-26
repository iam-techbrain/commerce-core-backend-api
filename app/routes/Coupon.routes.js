const express = require('express');
const CouponController = require('../controllers/Coupon.controller');
const verifyToken = require('../middleware/Auth.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Coupons
 *   description: Discount Coupon & Promo Code Management APIs
 */

/**
 * @swagger
 * /api/coupons:
 *   get:
 *     summary: Fetch all available coupons (Admin/Public)
 *     tags: [Coupons]
 *     responses:
 *       200:
 *         description: List of coupons
 */
router.get('/', CouponController.getAll);

/**
 * @swagger
 * /api/coupons:
 *   post:
 *     summary: Create a new discount coupon (Protected)
 *     tags: [Coupons]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - discountType
 *               - discountValue
 *               - expiryDate
 *             properties:
 *               code:
 *                 type: string
 *                 example: SAVE20
 *               discountType:
 *                 type: string
 *                 enum: [PERCENTAGE, FIXED]
 *                 example: PERCENTAGE
 *               discountValue:
 *                 type: number
 *                 example: 20
 *               minOrderValue:
 *                 type: number
 *                 example: 500
 *               maxDiscountAmount:
 *                 type: number
 *                 example: 200
 *               expiryDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-12-31T23:59:59.000Z"
 *     responses:
 *       201:
 *         description: Coupon created successfully
 */
router.post('/', verifyToken, CouponController.create);

/**
 * @swagger
 * /api/coupons/apply:
 *   post:
 *     summary: Validate and calculate discount for coupon code
 *     tags: [Coupons]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - cartAmount
 *             properties:
 *               code:
 *                 type: string
 *                 example: SAVE20
 *               cartAmount:
 *                 type: number
 *                 example: 1200
 *     responses:
 *       200:
 *         description: Coupon successfully applied with discount breakdown
 *       400:
 *         description: Invalid, expired, or min order limit error
 */
router.post('/apply', CouponController.applyCoupon);

/**
 * @swagger
 * /api/coupons/{id}:
 *   delete:
 *     summary: Delete a coupon (Protected)
 *     tags: [Coupons]
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
 *         description: Coupon deleted
 */
router.delete('/:id', verifyToken, CouponController.delete);

module.exports = router;
