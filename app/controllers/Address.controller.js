const { prisma } = require('../database/Prisma.database');
const { formatResponse } = require('../helpers/App.helper');

class AddressController {
  // 1. Get All Addresses of Logged-in User
  static async getUserAddresses(req, res, next) {
    try {
      const userId = parseInt(req.user.id);
      const addresses = await prisma.address.findMany({
        where: { userId },
        orderBy: { isDefault: 'desc' }
      });

      return res.status(200).json(formatResponse(true, 'User addresses fetched successfully', addresses));
    } catch (error) {
      next(error);
    }
  }

  // 2. Add New Address
  static async createAddress(req, res, next) {
    try {
      const userId = parseInt(req.user.id);
      const { fullName, phone, addressLine1, addressLine2, city, state, pincode, country, isDefault } = req.body;

      if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
        return res.status(400).json(formatResponse(false, 'Please fill in all required address fields.'));
      }

      // If set as default, reset other addresses default status
      if (isDefault) {
        await prisma.address.updateMany({
          where: { userId },
          data: { isDefault: false }
        });
      }

      const newAddress = await prisma.address.create({
        data: {
          userId,
          fullName,
          phone,
          addressLine1,
          addressLine2,
          city,
          state,
          pincode,
          country: country || 'India',
          isDefault: Boolean(isDefault)
        }
      });

      return res.status(201).json(formatResponse(true, 'Address added successfully! 🏡', newAddress));
    } catch (error) {
      next(error);
    }
  }

  // 3. Update Address
  static async updateAddress(req, res, next) {
    try {
      const userId = parseInt(req.user.id);
      const id = parseInt(req.params.id);
      const { fullName, phone, addressLine1, addressLine2, city, state, pincode, country, isDefault } = req.body;

      const existingAddress = await prisma.address.findFirst({
        where: { id, userId }
      });

      if (!existingAddress) {
        return res.status(404).json(formatResponse(false, 'Address not found!'));
      }

      if (isDefault) {
        await prisma.address.updateMany({
          where: { userId },
          data: { isDefault: false }
        });
      }

      const updatedAddress = await prisma.address.update({
        where: { id },
        data: {
          fullName: fullName || existingAddress.fullName,
          phone: phone || existingAddress.phone,
          addressLine1: addressLine1 || existingAddress.addressLine1,
          addressLine2: addressLine2 !== undefined ? addressLine2 : existingAddress.addressLine2,
          city: city || existingAddress.city,
          state: state || existingAddress.state,
          pincode: pincode || existingAddress.pincode,
          country: country || existingAddress.country,
          isDefault: isDefault !== undefined ? Boolean(isDefault) : existingAddress.isDefault
        }
      });

      return res.status(200).json(formatResponse(true, 'Address updated successfully!', updatedAddress));
    } catch (error) {
      next(error);
    }
  }

  // 4. Delete Address
  static async deleteAddress(req, res, next) {
    try {
      const userId = parseInt(req.user.id);
      const id = parseInt(req.params.id);

      const existingAddress = await prisma.address.findFirst({
        where: { id, userId }
      });

      if (!existingAddress) {
        return res.status(404).json(formatResponse(false, 'Address not found!'));
      }

      await prisma.address.delete({ where: { id } });

      return res.status(200).json(formatResponse(true, 'Address deleted successfully!'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AddressController;
