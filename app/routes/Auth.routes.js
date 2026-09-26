const express = require('express');
const AuthController = require('../controllers/Auth.controller');
const UserController = require('../controllers/User.controller');
const verifyToken = require('../middleware/Auth.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User Registration, Login & Profile Endpoints
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: john_doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: secret123
 *     responses:
 *       201:
 *         description: User successfully registered
 *       400:
 *         description: Missing fields or Email already exists
 */
router.post('/register', AuthController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user & return JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: secret123
 *     responses:
 *       200:
 *         description: Successful Login (Returns JWT Token)
 *       401:
 *         description: Invalid Password
 *       404:
 *         description: User Not Found
 */
router.post('/login', AuthController.login);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get logged-in user profile (Protected)
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profile data retrieved
 *       401:
 *         description: Missing token
 *       403:
 *         description: Invalid or Expired Token
 */
router.get('/profile', verifyToken, UserController.getProfile);

module.exports = router;
