const Razorpay = require('razorpay');
const crypto = require('crypto');
const { prisma } = require('../database/Prisma.database');
const appConfig = require('../config/app.config');
const { formatResponse } = require('../helpers/App.helper');
const Logger = require('../utils/Logger.util');
const EmailService = require('../utils/Email.util');

// Initialize Razorpay SDK instance
const razorpay = new Razorpay({
  key_id: appConfig.razorpay.keyId,
  key_secret: appConfig.razorpay.keySecret
});

class OrderController {
  // 1. Create Razorpay Order (Checkout Step 1)
  static async createOrder(req, res, next) {
    try {
      const userId = parseInt(req.user.id);
      const { addressId, couponCode } = req.body;

      if (!addressId) {
        return res.status(400).json(formatResponse(false, 'Shipping addressId required hai.'));
      }

      // Verify Address belongs to User
      const address = await prisma.address.findFirst({
        where: { id: parseInt(addressId), userId }
      });

      if (!address) {
        return res.status(404).json(formatResponse(false, 'Address not found or does not belong to you!'));
      }

      // Get User Cart
      const cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              product: true,
              variant: true
            }
          }
        }
      });

      if (!cart || cart.items.length === 0) {
        return res.status(400).json(formatResponse(false, 'Your cart is empty!'));
      }

      // Calculate Total Amount & Check Stock Availability
      let subtotal = 0;
      for (const item of cart.items) {
        const availableStock = item.variant ? item.variant.stock : item.product.stock;
        const itemName = item.variant
          ? `${item.product.name} (${item.variant.title || 'Variant'})`
          : item.product.name;

        if (item.quantity > availableStock) {
          return res.status(400).json(
            formatResponse(
              false,
              `Product "${itemName}" is out of stock (Available: ${availableStock}, In cart: ${item.quantity}).`
            )
          );
        }
        const effectivePrice = item.variant ? item.variant.price : item.product.price;
        subtotal += item.quantity * effectivePrice;
      }

      // Coupon Discount Calculation
      let discountAmount = 0;
      if (couponCode) {
        const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
        if (coupon && coupon.isActive && new Date() <= new Date(coupon.expiryDate) && subtotal >= coupon.minOrderValue) {
          if (coupon.discountType === 'PERCENTAGE') {
            discountAmount = (subtotal * coupon.discountValue) / 100;
            if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
              discountAmount = coupon.maxDiscountAmount;
            }
          } else {
            discountAmount = coupon.discountValue;
          }
        }
      }

      const shippingFee = subtotal > 1000 ? 0 : 50; // Free shipping over ₹1000
      const taxAmount = (subtotal - discountAmount) * 0.18; // 18% GST
      const finalAmount = Math.round((subtotal - discountAmount + shippingFee + taxAmount) * 100) / 100;

      // Create Razorpay Order
      const razorpayOrderOptions = {
        amount: Math.round(finalAmount * 100), // Amount in paise (1 INR = 100 paise)
        currency: 'INR',
        receipt: `receipt_order_${Date.now()}`
      };

      const razorpayOrder = await razorpay.orders.create(razorpayOrderOptions);

      // Save Order in Database
      const orderNumber = `ORD-${Date.now()}`;
      const dbOrder = await prisma.order.create({
        data: {
          orderNumber,
          userId,
          addressId: parseInt(addressId),
          totalAmount: subtotal,
          discountAmount,
          shippingFee,
          taxAmount,
          finalAmount,
          paymentStatus: 'PENDING',
          orderStatus: 'PENDING',
          razorpayOrderId: razorpayOrder.id,
          items: {
            create: cart.items.map((item) => {
              const effectivePrice = item.variant ? item.variant.price : item.product.price;
              const variantName = item.variant ? (item.variant.title || 'Standard') : null;

              return {
                productId: item.productId,
                variantId: item.variantId || null,
                variantName,
                quantity: item.quantity,
                unitPrice: effectivePrice,
                totalPrice: item.quantity * effectivePrice
              };
            })
          }
        },
        include: { items: { include: { product: true, variant: true } }, address: true, user: true }
      });

      return res.status(201).json(
        formatResponse(true, 'Razorpay Order created successfully!', {
          order: dbOrder,
          razorpay: {
            orderId: razorpayOrder.id,
            keyId: appConfig.razorpay.keyId,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency
          }
        })
      );
    } catch (error) {
      next(error);
    }
  }

  // 2. Verify Razorpay Payment Signature (Checkout Step 2)
  static async verifyPayment(req, res, next) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id) {
        return res.status(400).json(formatResponse(false, 'Razorpay order_id and payment_id are required.'));
      }

      // Check if testing with dummy payment ID in development mode
      const isTestDummyMode = (appConfig.env === 'development' || !process.env.NODE_ENV || process.env.NODE_ENV === 'development') && razorpay_payment_id.startsWith('pay_test_dummy');

      if (!isTestDummyMode) {
        if (!razorpay_signature) {
          return res.status(400).json(formatResponse(false, 'razorpay_signature is required.'));
        }

        // HMAC SHA256 Signature Verification
        const generatedSignature = crypto
          .createHmac('sha256', appConfig.razorpay.keySecret)
          .update(`${razorpay_order_id}|${razorpay_payment_id}`)
          .digest('hex');

        if (generatedSignature !== razorpay_signature) {
          Logger.error('Razorpay signature verification failed!');
          return res.status(400).json(formatResponse(false, 'Payment signature verification failed!'));
        }
      }

      // Update Order Status in Database
      const order = await prisma.order.findUnique({
        where: { razorpayOrderId: razorpay_order_id },
        include: { items: true, user: true, address: true }
      });

      if (!order) {
        return res.status(404).json(formatResponse(false, 'Order not found in database!'));
      }

      // Update Order as PAID and PROCESSING
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          orderStatus: 'PROCESSING',
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature || 'TEST_DUMMY_SIGNATURE'
        },
        include: { items: { include: { product: true } }, address: true, user: true }
      });

      // Decrement Stock for each ordered product and variant
      for (const item of order.items) {
        if (item.variantId) {
          try {
            await prisma.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { decrement: item.quantity } }
            });
          } catch (varErr) {
            Logger.error(`Failed to decrement variant ${item.variantId} stock: ${varErr.message}`);
          }
        }
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });
      }

      // Clear User Cart after successful order payment
      const cart = await prisma.cart.findUnique({ where: { userId: order.userId } });
      if (cart) {
        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      }

      // Trigger Email Confirmation
      await EmailService.sendOrderConfirmation(updatedOrder.user.email, updatedOrder);

      Logger.info(`Payment verified & Order #${order.orderNumber} successfully processed!`);
      return res.status(200).json(
        formatResponse(true, 'Payment Verified! Your order has been placed successfully. 🎉', updatedOrder)
      );
    } catch (error) {
      next(error);
    }
  }

  // 3. Get Logged-in User Orders History
  static async getUserOrders(req, res, next) {
    try {
      const userId = parseInt(req.user.id);
      const orders = await prisma.order.findMany({
        where: { userId },
        include: { items: { include: { product: true, variant: true } }, address: true },
        orderBy: { createdAt: 'desc' }
      });

      return res.status(200).json(formatResponse(true, 'User orders history fetched', orders));
    } catch (error) {
      next(error);
    }
  }

  // 4. Get Single Order Details
  static async getOrderDetails(req, res, next) {
    try {
      const userId = parseInt(req.user.id);
      const id = parseInt(req.params.id);

      const order = await prisma.order.findFirst({
        where: { id, userId },
        include: { items: { include: { product: true, variant: true } }, address: true }
      });

      if (!order) {
        return res.status(404).json(formatResponse(false, 'Order not found!'));
      }

      return res.status(200).json(formatResponse(true, 'Order details fetched', order));
    } catch (error) {
      next(error);
    }
  }

  // 5. Get All Orders (Admin)
  static async getAllOrdersAdmin(req, res, next) {
    try {
      const orders = await prisma.order.findMany({
        include: {
          user: { select: { username: true, email: true } },
          items: { include: { product: true, variant: true } },
          address: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.status(200).json(formatResponse(true, 'All admin orders fetched', orders));
    } catch (error) {
      next(error);
    }
  }

  // 6. Update Order Status (Admin)
  static async updateOrderStatusAdmin(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const { orderStatus } = req.body;

      const allowedStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
      if (!orderStatus || !allowedStatuses.includes(orderStatus)) {
        return res.status(400).json(formatResponse(false, 'Invalid orderStatus! Allowed: PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED'));
      }

      const updatedOrder = await prisma.order.update({
        where: { id },
        data: { orderStatus },
        include: { items: { include: { product: true, variant: true } }, address: true, user: true }
      });

      // Email Notification
      await EmailService.sendOrderStatusUpdate(updatedOrder.user.email, updatedOrder.orderNumber, orderStatus);

      return res.status(200).json(formatResponse(true, `Order status updated to "${orderStatus}" successfully!`, updatedOrder));
    } catch (error) {
      next(error);
    }
  }

  // 7. Cancel Order (Restores product and variant stock!)
  static async cancelOrder(req, res, next) {
    try {
      const userId = parseInt(req.user.id);
      const id = parseInt(req.params.id);

      const order = await prisma.order.findFirst({
        where: { id, userId },
        include: { items: true }
      });

      if (!order) {
        return res.status(404).json(formatResponse(false, 'Order not found!'));
      }

      if (['SHIPPED', 'DELIVERED', 'CANCELLED'].includes(order.orderStatus)) {
        return res.status(400).json(formatResponse(false, `Order cannot be cancelled because its status is "${order.orderStatus}".`));
      }

      // Restore Product & Variant Stock if order was paid or processing
      for (const item of order.items) {
        if (item.variantId) {
          try {
            await prisma.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } }
            });
          } catch (varErr) {
            Logger.error(`Failed to restore variant ${item.variantId} stock: ${varErr.message}`);
          }
        }
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } }
        });
      }

      const cancelledOrder = await prisma.order.update({
        where: { id },
        data: { orderStatus: 'CANCELLED' }
      });

      return res.status(200).json(formatResponse(true, 'Order cancelled successfully and stock restored!', cancelledOrder));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = OrderController;
