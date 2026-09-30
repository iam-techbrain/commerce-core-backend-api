const express = require('express');
const UserController = require('../controllers/User.controller');
const verifyToken = require('../middleware/Auth.middleware');
const upload = require('../middleware/Upload.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User Management & Profile APIs
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Fetch all registered users (Protected)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/', verifyToken, UserController.getAllUsers);

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Fetch current user profile (Protected)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 */
router.get('/profile', verifyToken, UserController.getProfile);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user details (Protected)
 *     tags: [Users]
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 */
router.put('/:id', verifyToken, upload.single('avatar'), UserController.updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user by ID (Protected)
 *     tags: [Users]
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
 *         description: User deleted successfully
 */
router.delete('/:id', verifyToken, UserController.deleteUser);

module.exports = router;
