const express = require('express');
const DashboardController = require('../controllers/Dashboard.controller');
const verifyToken = require('../middleware/Auth.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Admin Analytics & Store Diagnostics APIs
 */

/**
 * @swagger
 * /api/dashboard/analytics:
 *   get:
 *     summary: Fetch full store revenue, sales, top products, & stock analytics (Admin/Protected)
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Full store analytics dataset
 */
router.get('/analytics', verifyToken, DashboardController.getAnalytics);

module.exports = router;
