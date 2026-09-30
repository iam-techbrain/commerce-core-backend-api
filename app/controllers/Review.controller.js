const { prisma } = require('../database/Prisma.database');
const { formatResponse } = require('../helpers/App.helper');

class ReviewController {
  // 1. Add Review & Rating for Product
  static async addReview(req, res, next) {
    try {
      const userId = parseInt(req.user.id);
      const { productId, rating, comment } = req.body;

      if (!productId || !rating) {
        return res.status(400).json(formatResponse(false, 'productId aur rating (1 se 5) required hain.'));
      }

      const ratingVal = parseInt(rating);
      if (ratingVal < 1 || ratingVal > 5) {
        return res.status(400).json(formatResponse(false, 'Rating must be between 1 and 5.'));
      }

      const product = await prisma.product.findUnique({
        where: { id: parseInt(productId) }
      });

      if (!product) {
        return res.status(404).json(formatResponse(false, 'Product not found!'));
      }

      // Check if user already reviewed this product
      const existingReview = await prisma.review.findFirst({
        where: { userId, productId: parseInt(productId) }
      });

      if (existingReview) {
        // Update existing review
        const updatedReview = await prisma.review.update({
          where: { id: existingReview.id },
          data: { rating: ratingVal, comment }
        });
        return res.status(200).json(formatResponse(true, 'Review updated successfully! ⭐', updatedReview));
      }

      // Create new review
      const review = await prisma.review.create({
        data: {
          userId,
          productId: parseInt(productId),
          rating: ratingVal,
          comment
        },
        include: { user: { select: { username: true } } }
      });

      return res.status(201).json(formatResponse(true, 'Review added successfully! ⭐', review));
    } catch (error) {
      next(error);
    }
  }

  // 2. Get Product Reviews
  static async getProductReviews(req, res, next) {
    try {
      const productId = parseInt(req.params.productId);

      const reviews = await prisma.review.findMany({
        where: { productId },
        include: { user: { select: { username: true } } },
        orderBy: { createdAt: 'desc' }
      });

      // Calculate Average Rating
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      return res.status(200).json(
        formatResponse(true, 'Product reviews fetched', {
          totalReviews: reviews.length,
          averageRating: Math.round(avgRating * 10) / 10,
          reviews
        })
      );
    } catch (error) {
      next(error);
    }
  }

  // 3. Delete Review
  static async deleteReview(req, res, next) {
    try {
      const userId = parseInt(req.user.id);
      const id = parseInt(req.params.id);

      const review = await prisma.review.findFirst({
        where: { id, userId }
      });

      if (!review) {
        return res.status(404).json(formatResponse(false, 'Review not found or does not belong to you!'));
      }

      await prisma.review.delete({ where: { id } });

      return res.status(200).json(formatResponse(true, 'Review deleted successfully!'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ReviewController;
