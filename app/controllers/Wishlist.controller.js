const { prisma } = require('../database/Prisma.database');
const { formatResponse } = require('../helpers/App.helper');

class WishlistController {
  // 1. Get User Wishlist
  static async getWishlist(req, res, next) {
    try {
      const userId = parseInt(req.user.id);
      const wishlist = await prisma.wishlist.findMany({
        where: { userId },
        include: { product: { include: { category: true } } },
        orderBy: { createdAt: 'desc' }
      });

      return res.status(200).json(formatResponse(true, 'User wishlist fetched successfully', wishlist));
    } catch (error) {
      next(error);
    }
  }

  // 2. Toggle Wishlist Item (Add if not in wishlist, Remove if already in wishlist)
  static async toggleWishlist(req, res, next) {
    try {
      const userId = parseInt(req.user.id);
      const { productId } = req.body;

      if (!productId) {
        return res.status(400).json(formatResponse(false, 'productId is required.'));
      }

      const product = await prisma.product.findUnique({
        where: { id: parseInt(productId) }
      });

      if (!product) {
        return res.status(404).json(formatResponse(false, 'Product not found!'));
      }

      const existingWishlist = await prisma.wishlist.findUnique({
        where: {
          userId_productId: {
            userId,
            productId: parseInt(productId)
          }
        }
      });

      if (existingWishlist) {
        // Remove from Wishlist
        await prisma.wishlist.delete({ where: { id: existingWishlist.id } });
        return res.status(200).json(formatResponse(true, 'Product removed from wishlist! ❤️', { isWishlisted: false }));
      } else {
        // Add to Wishlist
        const newWishlist = await prisma.wishlist.create({
          data: { userId, productId: parseInt(productId) },
          include: { product: true }
        });
        return res.status(201).json(formatResponse(true, 'Product added to wishlist! ❤️', { isWishlisted: true, wishlist: newWishlist }));
      }
    } catch (error) {
      next(error);
    }
  }
}

module.exports = WishlistController;
