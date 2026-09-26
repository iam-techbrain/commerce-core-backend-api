const express = require('express');
const OrderController = require('../controllers/Order.controller');
const InvoiceController = require('../controllers/Invoice.controller');
const verifyToken = require('../middleware/Auth.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order Processing & Razorpay Checkout Integration APIs
 */

/**
 * @swagger
 * /api/orders/create:
 *   post:
 *     summary: Step 1 - Create Order & Razorpay Order ID for Checkout (Protected)
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - addressId
 *             properties:
 *               addressId:
 *                 type: integer
 *               couponCode:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created with Razorpay Order details
 */
router.post('/create', verifyToken, OrderController.createOrder);

/**
 * @swagger
 * /api/orders/verify:
 *   post:
 *     summary: Step 2 - Verify Razorpay Payment Signature & Complete Order (Protected)
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - razorpay_order_id
 *               - razorpay_payment_id
 *               - razorpay_signature
 *             properties:
 *               razorpay_order_id:
 *                 type: string
 *               razorpay_payment_id:
 *                 type: string
 *               razorpay_signature:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment verified, stock decremented, and order marked PAID
 */
router.post('/verify', verifyToken, OrderController.verifyPayment);
router.post('/verify-payment', verifyToken, OrderController.verifyPayment);

/**
 * @swagger
 * /api/orders/my-orders:
 *   get:
 *     summary: Fetch logged-in user order history (Protected)
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of user orders
 */
router.get('/my-orders', verifyToken, OrderController.getUserOrders);

/**
 * @swagger
 * /api/orders/admin/all:
 *   get:
 *     summary: Fetch all orders for store admin (Protected)
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of all store orders
 */
router.get('/admin/all', verifyToken, OrderController.getAllOrdersAdmin);

/**
 * @swagger
 * /api/orders/{orderId}/invoice:
 *   get:
 *     summary: Download PDF Invoice for an order (Protected)
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: PDF file download stream
 */
router.get('/:orderId/invoice', verifyToken, InvoiceController.downloadInvoice);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Fetch single order details by ID (Protected)
 *     tags: [Orders]
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
 *         description: Detailed order summary
 */
router.get('/:id', verifyToken, OrderController.getOrderDetails);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     summary: Admin - Update order status (PROCESSING, SHIPPED, DELIVERED, CANCELLED)
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderStatus
 *             properties:
 *               orderStatus:
 *                 type: string
 *                 enum: [PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED]
 *     responses:
 *       200:
 *         description: Order status updated
 */
router.put('/:id/status', verifyToken, OrderController.updateOrderStatusAdmin);

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   post:
 *     summary: Cancel an order & restore product stock (Protected)
 *     tags: [Orders]
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
 *         description: Order cancelled & stock restored
 */
router.post('/:id/cancel', verifyToken, OrderController.cancelOrder);

module.exports = router;
