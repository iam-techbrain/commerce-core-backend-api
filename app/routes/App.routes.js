const express = require('express');
const AppController = require('../controllers/App.controller');

const router = express.Router();

/**
 * @swagger
 * /api/app/status:
 *   get:
 *     summary: Check system status and uptime
 *     tags: [System]
 *     responses:
 *       200:
 *         description: System operational response
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Enterprise SaaS E-Commerce API is operational 🚀
 *               data:
 *                 serverTime: "2026-09-26T16:00:00.000Z"
 *                 uptime: 12.45
 */
router.get('/status', AppController.getStatus);

module.exports = router;
