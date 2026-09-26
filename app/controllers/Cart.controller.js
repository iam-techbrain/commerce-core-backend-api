const { prisma } = require('../database/Prisma.database');
const { formatResponse } = require('../helpers/App.helper');

class CartController {
  // Helper: Get or Create Cart for User
  static async getOrCreateCart(userId) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: { include: { category: true } } }
        }
      }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: { product: { include: { category: true } } }
          }
        }
      });
    }

    return cart;
  }

  // 1. Get User Cart
  static async getCart(req, res, next) {
    try {
      const userId = parseInt(req.user.id);
      const cart = await CartController.getOrCreateCart(userId);

      // Calculate totals
      let subtotal = 0;
      let totalItems = 0;

      const itemsFormatted = cart.items.map((item) => {
        const itemTotal = item.quantity * item.product.price;
        subtotal += itemTotal;
        totalItems += item.quantity;

        return {
          id: item.id,
          productId: item.productId,
          productName: item.product.name,
          productImage: item.product.imageUrl,
          price: item.product.price,
          quantity: item.quantity,
          stockAvailable: item.product.stock,
          itemTotal
        };
      });

      return res.status(200).json(
        formatResponse(true, 'User cart fetched successfully', {
          cartId: cart.id,
          totalItems,
          subtotal,
          items: itemsFormatted
        })
      );
    } catch (error) {
      next(error);
    }
  }

  // 2. Add Item to Cart (With Stock Availability Validation)
  static async addItem(req, res, next) {
    try {
      const userId = parseInt(req.user.id);
      const { productId, quantity } = req.body;

      const qty = quantity ? parseInt(quantity) : 1;
      if (qty <= 0) {
        return res.status(400).json(formatResponse(false, 'Quantity 1 ya usse zyada honi chahiye.'));
      }

      // Check if product exists and has enough stock
      const product = await prisma.product.findUnique({
        where: { id: parseInt(productId) }
      });

      if (!product) {
        return res.status(404).json(formatResponse(false, 'Product nahi mila!'));
      }

      const cart = await CartController.getOrCreateCart(userId);

      // Check existing item in cart
      const existingItem = await prisma.cartItem.findFirst({
        where: { cartId: cart.id, productId: parseInt(productId) }
      });

      const newQty = existingItem ? existingItem.quantity + qty : qty;

      // 🔴 STOCK VALIDATION CHECK
      if (newQty > product.stock) {
        return res.status(400).json(
          formatResponse(
            false,
            `Stock limit exceeded! Is product ka sirf ${product.stock} quantity available hai.`
          )
        );
      }

      if (existingItem) {
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQty }
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: parseInt(productId),
            quantity: qty
          }
        });
      }

      return res.status(200).json(formatResponse(true, 'Product cart me add ho gaya! 🛒'));
    } catch (error) {
      next(error);
    }
  }

  // 3. Update Cart Item Quantity
  static async updateQuantity(req, res, next) {
    try {
      const userId = parseInt(req.user.id);
      const itemId = parseInt(req.params.itemId);
      const { quantity } = req.body;

      const qty = parseInt(quantity);
      if (qty <= 0) {
        return res.status(400).json(formatResponse(false, 'Quantity 1 ya usse zyada honi chahiye.'));
      }

      const cart = await CartController.getOrCreateCart(userId);
      const cartItem = await prisma.cartItem.findFirst({
        where: { id: itemId, cartId: cart.id },
        include: { product: true }
      });

      if (!cartItem) {
        return res.status(404).json(formatResponse(false, 'Cart item nahi mila!'));
      }

      // Stock Check
      if (qty > cartItem.product.stock) {
        return res.status(400).json(
          formatResponse(false, `Stock limit exceeded! Max ${cartItem.product.stock} items available hain.`)
        );
      }

      await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity: qty }
      });

      return res.status(200).json(formatResponse(true, 'Cart item quantity update ho gayi!'));
    } catch (error) {
      next(error);
    }
  }

  // 4. Remove Item from Cart
  static async removeItem(req, res, next) {
    try {
      const userId = parseInt(req.user.id);
      const itemId = parseInt(req.params.itemId);

      const cart = await CartController.getOrCreateCart(userId);
      const cartItem = await prisma.cartItem.findFirst({
        where: { id: itemId, cartId: cart.id }
      });

      if (!cartItem) {
        return res.status(404).json(formatResponse(false, 'Cart item nahi mila!'));
      }

      await prisma.cartItem.delete({ where: { id: itemId } });

      return res.status(200).json(formatResponse(true, 'Item cart se remove ho gaya!'));
    } catch (error) {
      next(error);
    }
  }

  // 5. Clear Cart
  static async clearCart(req, res, next) {
    try {
      const userId = parseInt(req.user.id);
      const cart = await CartController.getOrCreateCart(userId);

      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      });

      return res.status(200).json(formatResponse(true, 'Cart clear ho gayi!'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CartController;
