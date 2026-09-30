const { prisma } = require('../database/Prisma.database');
const { formatResponse } = require('../helpers/App.helper');

class CartController {
  // Helper: Get or Create Cart for User
  static async getOrCreateCart(userId) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: { include: { category: true } },
            variant: true
          }
        }
      }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: { include: { category: true } },
              variant: true
            }
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
        const effectivePrice = item.variant ? item.variant.price : item.product.price;
        const effectiveMrp = item.variant?.mrp || item.product.mrp || null;
        const effectiveStock = item.variant ? item.variant.stock : item.product.stock;
        const itemTotal = item.quantity * effectivePrice;
        subtotal += itemTotal;
        totalItems += item.quantity;

        let parsedAttributes = null;
        if (item.variant?.attributes) {
          try {
            parsedAttributes = JSON.parse(item.variant.attributes);
          } catch (e) {
            parsedAttributes = item.variant.attributes;
          }
        }

        return {
          id: item.id,
          productId: item.productId,
          variantId: item.variantId || null,
          variantTitle: item.variant ? item.variant.title : null,
          variantAttributes: parsedAttributes,
          productName: item.product.name,
          productImage: item.variant?.imageUrl || item.product.imageUrl,
          price: effectivePrice,
          mrp: effectiveMrp,
          quantity: item.quantity,
          stockAvailable: effectiveStock,
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

  // 2. Add Item to Cart (With Variant & Stock Availability Validation)
  static async addItem(req, res, next) {
    try {
      const userId = parseInt(req.user.id);
      const { productId, quantity, variantId } = req.body;

      const qty = quantity ? parseInt(quantity) : 1;
      if (qty <= 0) {
        return res.status(400).json(formatResponse(false, 'Quantity must be 1 or greater.'));
      }

      const parsedProductId = parseInt(productId);
      const parsedVariantId = variantId ? parseInt(variantId) : null;

      // Check if product exists
      const product = await prisma.product.findUnique({
        where: { id: parsedProductId }
      });

      if (!product) {
        return res.status(404).json(formatResponse(false, 'Product not found!'));
      }

      // Check if variant exists and matches product if specified
      let variant = null;
      if (parsedVariantId) {
        variant = await prisma.productVariant.findFirst({
          where: { id: parsedVariantId, productId: parsedProductId }
        });
        if (!variant) {
          return res.status(404).json(formatResponse(false, 'Product variant not found!'));
        }
      }

      const availableStock = variant ? variant.stock : product.stock;

      const cart = await CartController.getOrCreateCart(userId);

      // Check existing item in cart
      const existingItem = await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId: parsedProductId,
          variantId: parsedVariantId
        }
      });

      const newQty = existingItem ? existingItem.quantity + qty : qty;

      // 🔴 STOCK VALIDATION CHECK
      if (newQty > availableStock) {
        return res.status(400).json(
          formatResponse(
            false,
            `Stock limit exceeded! Only ${availableStock} units available.`
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
            productId: parsedProductId,
            variantId: parsedVariantId,
            quantity: qty
          }
        });
      }

      return res.status(200).json(formatResponse(true, 'Product added to cart! 🛒'));
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
        return res.status(400).json(formatResponse(false, 'Quantity must be 1 or greater.'));
      }

      const cart = await CartController.getOrCreateCart(userId);
      const cartItem = await prisma.cartItem.findFirst({
        where: { id: itemId, cartId: cart.id },
        include: { product: true, variant: true }
      });

      if (!cartItem) {
        return res.status(404).json(formatResponse(false, 'Cart item not found!'));
      }

      const availableStock = cartItem.variant ? cartItem.variant.stock : cartItem.product.stock;

      // Stock Check
      if (qty > availableStock) {
        return res.status(400).json(
          formatResponse(false, `Stock limit exceeded! Maximum ${availableStock} units available.`)
        );
      }

      await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity: qty }
      });

      return res.status(200).json(formatResponse(true, 'Cart item quantity updated!'));
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
        return res.status(404).json(formatResponse(false, 'Cart item not found!'));
      }

      await prisma.cartItem.delete({ where: { id: itemId } });

      return res.status(200).json(formatResponse(true, 'Item removed from cart!'));
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

      return res.status(200).json(formatResponse(true, 'Cart cleared successfully!'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CartController;
