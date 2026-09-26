const { prisma } = require('../database/Prisma.database');
const { formatResponse } = require('../helpers/App.helper');

class CouponController {
  // 1. Create Coupon (Admin)
  static async create(req, res, next) {
    try {
      const { code, discountType, discountValue, minOrderValue, maxDiscountAmount, usageLimit, expiryDate } = req.body;

      if (!code || !discountType || !discountValue || !expiryDate) {
        return res.status(400).json(formatResponse(false, 'Code, discountType (PERCENTAGE/FIXED), discountValue aur expiryDate required hain.'));
      }

      const existingCoupon = await prisma.coupon.findUnique({
        where: { code: code.toUpperCase() }
      });

      if (existingCoupon) {
        return res.status(400).json(formatResponse(false, 'Is code ka coupon pehle se exist karta hai!'));
      }

      const coupon = await prisma.coupon.create({
        data: {
          code: code.toUpperCase(),
          discountType: discountType.toUpperCase(),
          discountValue: parseFloat(discountValue),
          minOrderValue: minOrderValue ? parseFloat(minOrderValue) : 0,
          maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
          usageLimit: usageLimit ? parseInt(usageLimit) : 100,
          expiryDate: new Date(expiryDate)
        }
      });

      return res.status(201).json(formatResponse(true, 'Coupon create ho gaya! 🎟️', coupon));
    } catch (error) {
      next(error);
    }
  }

  // 2. Validate & Apply Coupon
  static async applyCoupon(req, res, next) {
    try {
      const { code, cartAmount } = req.body;

      if (!code || cartAmount === undefined) {
        return res.status(400).json(formatResponse(false, 'Coupon code aur cartAmount required hain.'));
      }

      const coupon = await prisma.coupon.findUnique({
        where: { code: code.toUpperCase() }
      });

      if (!coupon || !coupon.isActive) {
        return res.status(404).json(formatResponse(false, 'Invalid ya inactive coupon code!'));
      }

      // Check Expiry Date
      if (new Date() > new Date(coupon.expiryDate)) {
        return res.status(400).json(formatResponse(false, 'Ye coupon code expire ho chuka hai!'));
      }

      // Check Usage Limit
      if (coupon.timesUsed >= coupon.usageLimit) {
        return res.status(400).json(formatResponse(false, 'Coupon usage limit khatam ho gayi hai!'));
      }

      const amount = parseFloat(cartAmount);
      if (amount < coupon.minOrderValue) {
        return res.status(400).json(
          formatResponse(false, `Is coupon ke liye minimum order amount ₹${coupon.minOrderValue} hona chahiye.`)
        );
      }

      // Calculate Discount
      let discountAmount = 0;
      if (coupon.discountType === 'PERCENTAGE') {
        discountAmount = (amount * coupon.discountValue) / 100;
        if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
          discountAmount = coupon.maxDiscountAmount;
        }
      } else {
        discountAmount = coupon.discountValue;
      }

      discountAmount = Math.min(discountAmount, amount);
      const finalAmount = amount - discountAmount;

      return res.status(200).json(
        formatResponse(true, 'Coupon successfully apply ho gaya! 🎉', {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          discountAmount,
          originalAmount: amount,
          finalAmount
        })
      );
    } catch (error) {
      next(error);
    }
  }

  // 3. Get All Coupons
  static async getAll(req, res, next) {
    try {
      const coupons = await prisma.coupon.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json(formatResponse(true, 'Coupons fetched successfully', coupons));
    } catch (error) {
      next(error);
    }
  }

  // 4. Delete Coupon
  static async delete(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      await prisma.coupon.delete({ where: { id } });
      return res.status(200).json(formatResponse(true, 'Coupon delete ho gaya!'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CouponController;
