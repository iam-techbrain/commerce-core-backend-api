const bcrypt = require('bcryptjs');

/**
 * In-memory User Model Store (Simulating Mongoose / DB ORM)
 */
const usersCollection = [];

class UserModel {
  // Find User by Email
  static async findByEmail(email) {
    return usersCollection.find((user) => user.email === email);
  }

  // Find User by ID
  static async findById(id) {
    return usersCollection.find((user) => user.id === id);
  }

  // Create & Hash Password for New User
  static async create({ username, email, password }) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      id: Date.now().toString(),
      username,
      email,
      password: hashedPassword,
      createdAt: new Date()
    };

    usersCollection.push(newUser);
    return newUser;
  }

  // Verify Password
  static async comparePassword(enteredPassword, storedHashedPassword) {
    return await bcrypt.compare(enteredPassword, storedHashedPassword);
  }

  // Get All Users (excluding passwords)
  static async getAll() {
    return usersCollection.map(({ password, ...userWithoutPassword }) => userWithoutPassword);
  }
}

module.exports = UserModel;
