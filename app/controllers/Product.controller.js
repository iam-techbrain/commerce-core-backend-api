const { prisma } = require('../database/Prisma.database');
const { formatResponse, deleteUploadedFile } = require('../helpers/App.helper');

class ProductController {
  // 1. Get All Products (With PAGINATION, Search, Filter & Sorting)
  static async getAll(req, res, next) {
    try {
      // Extract Query Parameters for Pagination & Search
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId) : undefined;
      const sortBy = req.query.sortBy || 'createdAt'; // 'price', 'name', 'createdAt'
      const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';

      const skip = (page - 1) * limit;

      // Construct Filter Condition
      const where = {
        ...(categoryId && { categoryId }),
        ...(search && {
          OR: [
            { name: { contains: search } },
            { description: { contains: search } }
          ]
        })
      };

      // Fetch Total Count for Pagination metadata
      const totalCount = await prisma.product.count({ where });

      // Fetch Paginated Products
      const products = await prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { category: true }
      });

      const totalPages = Math.ceil(totalCount / limit);

      const pagination = {
        currentPage: page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      };

      return res.status(200).json(
        formatResponse(true, 'Products fetched successfully with pagination', products, null, pagination)
      );
    } catch (error) {
      next(error);
    }
  }

  // 2. Get Single Product by ID
  static async getById(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const product = await prisma.product.findUnique({
        where: { id },
        include: { category: true, reviews: { include: { user: { select: { username: true } } } } }
      });

      if (!product) {
        return res.status(404).json(formatResponse(false, 'Product nahi mila!'));
      }

      return res.status(200).json(formatResponse(true, 'Product details fetched', product));
    } catch (error) {
      next(error);
    }
  }

  // 3. Get Low Stock Products (Stock < threshold, Default 5)
  static async getLowStockProducts(req, res, next) {
    try {
      const threshold = req.query.threshold ? parseInt(req.query.threshold) : 5;

      const lowStockProducts = await prisma.product.findMany({
        where: { stock: { lte: threshold } },
        include: { category: true },
        orderBy: { stock: 'asc' }
      });

      return res.status(200).json(
        formatResponse(true, `Low stock products fetched (Threshold <= ${threshold})`, lowStockProducts)
      );
    } catch (error) {
      next(error);
    }
  }

  // 4. Add New Product (With Image Cleanup on Failure)
  static async create(req, res, next) {
    try {
      const { name, sku, description, price, stock, categoryId } = req.body;

      if (!name || !price || !categoryId) {
        deleteUploadedFile(req.file);
        return res.status(400).json(formatResponse(false, 'Product name, price aur categoryId required hain.'));
      }

      const categoryExists = await prisma.category.findUnique({
        where: { id: parseInt(categoryId) }
      });

      if (!categoryExists) {
        deleteUploadedFile(req.file);
        return res.status(404).json(formatResponse(false, 'Di gayi Category ID exist nahi karti!'));
      }

      const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

      const product = await prisma.product.create({
        data: {
          name,
          sku: sku || `SKU-${Date.now()}`,
          description,
          price: parseFloat(price),
          stock: stock ? parseInt(stock) : 0,
          imageUrl,
          categoryId: parseInt(categoryId)
        },
        include: { category: true }
      });

      return res.status(201).json(formatResponse(true, 'Product successfully add ho gaya! 📦', product));
    } catch (error) {
      deleteUploadedFile(req.file);
      next(error);
    }
  }

  // 5. Update / Edit Product (With Image Cleanup on Failure)
  static async update(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const { name, sku, description, price, stock, categoryId } = req.body;

      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) {
        deleteUploadedFile(req.file);
        return res.status(404).json(formatResponse(false, 'Product nahi mila!'));
      }

      if (categoryId) {
        const categoryExists = await prisma.category.findUnique({ where: { id: parseInt(categoryId) } });
        if (!categoryExists) {
          deleteUploadedFile(req.file);
          return res.status(404).json(formatResponse(false, 'Category ID exist nahi karti!'));
        }
      }

      const updateData = {};
      if (name) updateData.name = name;
      if (sku) updateData.sku = sku;
      if (description !== undefined) updateData.description = description;
      if (price !== undefined) updateData.price = parseFloat(price);
      if (stock !== undefined) updateData.stock = parseInt(stock);
      if (categoryId !== undefined) updateData.categoryId = parseInt(categoryId);
      if (req.file) updateData.imageUrl = `/uploads/${req.file.filename}`;

      const updatedProduct = await prisma.product.update({
        where: { id },
        data: updateData,
        include: { category: true }
      });

      return res.status(200).json(formatResponse(true, 'Product successfully update ho gaya!', updatedProduct));
    } catch (error) {
      deleteUploadedFile(req.file);
      next(error);
    }
  }

  // 6. Delete Product
  static async delete(req, res, next) {
    try {
      const id = parseInt(req.params.id);

      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) {
        return res.status(404).json(formatResponse(false, 'Product nahi mila!'));
      }

      await prisma.product.delete({ where: { id } });

      return res.status(200).json(formatResponse(true, 'Product successfully delete ho gaya!'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProductController;
