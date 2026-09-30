const { prisma } = require('../database/Prisma.database');
const bcrypt = require('bcryptjs');
const { formatResponse } = require('../helpers/App.helper');

class UserController {
  // 1. Get Logged-in User Profile
  static async getProfile(req, res, next) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(req.user.id) },
        select: { id: true, username: true, email: true, phone: true, role: true, gender: true, avatar: true, createdAt: true }
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
        select: { id: true, username: true, email: true, phone: true, role: true, gender: true, avatar: true, createdAt: true },
        orderBy: { createdAt: 'desc' }
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
      const { username, email, phone, role, gender, avatar, password, currentPassword } = req.body;

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return res.status(404).json(formatResponse(false, 'User nahi mila!'));
      }

      const updateData = {};
      if (username !== undefined) updateData.username = username;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (role !== undefined) updateData.role = role;
      if (gender !== undefined) {
        updateData.gender = gender;
        // If avatar not explicitly specified as custom external url, auto-link gender avatar
        if (avatar === undefined && (!user.avatar || user.avatar.includes('/avatars/'))) {
          updateData.avatar = gender.toLowerCase() === 'female' ? '/avatars/female.avif' : '/avatars/male.avif';
        }
      }
      if (req.file) {
        updateData.avatar = `/uploads/${req.file.filename}`;
      } else if (avatar !== undefined) {
        updateData.avatar = avatar;
      }

      if (password) {
        if (currentPassword) {
          const isMatch = await bcrypt.compare(currentPassword, user.password);
          if (!isMatch) {
            return res.status(400).json(formatResponse(false, 'Current password galat hai!'));
          }
        }
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(password, salt);
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        select: { id: true, username: true, email: true, phone: true, role: true, gender: true, avatar: true, updatedAt: true }
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
