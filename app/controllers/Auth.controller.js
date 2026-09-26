const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { prisma } = require('../database/Prisma.database');
const appConfig = require('../config/app.config');
const { formatResponse } = require('../helpers/App.helper');

class AuthController {
  // Register Controller
  static async register(req, res, next) {
    try {
      const { username, email, password, role } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json(
          formatResponse(false, 'Please provide username, email, and password.')
        );
      }

      const existingUser = await prisma.user.findFirst({
        where: { OR: [{ email }, { username }] }
      });

      if (existingUser) {
        return res.status(400).json(
          formatResponse(false, 'Email ya Username pehle se registered hai!')
        );
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const assignedRole = (role && ['ADMIN', 'CUSTOMER', 'USER'].includes(role.toString().toUpperCase())) 
        ? role.toString().toUpperCase() 
        : 'CUSTOMER';

      const newUser = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          role: assignedRole
        },
        select: { id: true, username: true, email: true, role: true, createdAt: true }
      });

      return res.status(201).json(
        formatResponse(true, 'User registered successfully!', newUser)
      );
    } catch (error) {
      next(error);
    }
  }

  // Login Controller
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json(
          formatResponse(false, 'Please provide email and password.')
        );
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(404).json(
          formatResponse(false, 'Invalid credentials: User not found.')
        );
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json(
          formatResponse(false, 'Invalid credentials: Incorrect password.')
        );
      }

      // Generate JWT Token
      const tokenPayload = { id: user.id, username: user.username, email: user.email, role: user.role };
      const token = jwt.sign(tokenPayload, appConfig.jwt.secret, {
        expiresIn: appConfig.jwt.expiresIn
      });

      return res.status(200).json(
        formatResponse(true, 'Login successful!', {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          }
        })
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
