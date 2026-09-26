const { prisma } = require('../database/Prisma.database');
const bcrypt = require('bcryptjs');
const { formatResponse } = require('../helpers/App.helper');

class UserController {
  // 1. Get Logged-in User Profile
  static async getProfile(req, res, next) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(req.user.id) },
        select: { id: true, username: true, email: true, role: true, createdAt: true }
      });

      if (!user) {
        return res.status(404).json(formatResponse(false, 'User profile nahi milaa.'));
      }

      return res.status(200).json(formatResponse(true, 'User Profile fetched', user));
    } catch (error) {
      next(error);
    }
  }

  // 2. Get All Users (Admin)
  static async getAllUsers(req, res, next) {
    try {
      const users = await prisma.user.findMany({
        select: { id: true, username: true, email: true, role: true, createdAt: true }
      });

      return res.status(200).json(formatResponse(true, 'Users fetched successfully', users));
    } catch (error) {
      next(error);
    }
  }

  // 3. Update User Info
  static async updateUser(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const { username, email, password } = req.body;

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return res.status(404).json(formatResponse(false, 'User nahi mila!'));
      }

      const updateData = {};
      if (username) updateData.username = username;
      if (email) updateData.email = email;
      if (password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(password, salt);
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        select: { id: true, username: true, email: true, role: true, updatedAt: true }
      });

      return res.status(200).json(formatResponse(true, 'User details update ho gayi!', updatedUser));
    } catch (error) {
      next(error);
    }
  }

  // 4. Delete User
  static async deleteUser(req, res, next) {
    try {
      const id = parseInt(req.params.id);

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return res.status(404).json(formatResponse(false, 'User nahi mila!'));
      }

      await prisma.user.delete({ where: { id } });

      return res.status(200).json(formatResponse(true, 'User successfully delete ho gaya!'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;
