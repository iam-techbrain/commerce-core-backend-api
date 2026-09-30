const { prisma } = require('../database/Prisma.database');
const { formatResponse, deleteUploadedFile } = require('../helpers/App.helper');

class CategoryController {
  // 1. Get All Categories (Includes subcategories count and list)
  static async getAll(req, res, next) {
    try {
      const categories = await prisma.category.findMany({
        include: {
          subcategories: {
            include: {
              _count: { select: { products: true } }
            }
          },
          _count: { select: { products: true, subcategories: true } }
        },
        orderBy: { name: 'asc' }
      });

      return res.status(200).json(formatResponse(true, 'Categories fetched successfully', categories));
    } catch (error) {
      next(error);
    }
  }

  // 2. Get Single Category by ID
  static async getById(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          subcategories: {
            include: { _count: { select: { products: true } } }
          },
          products: {
            include: { brand: true, variants: true, subCategory: true }
          },
          _count: { select: { products: true, subcategories: true } }
        }
      });

      if (!category) {
        return res.status(404).json(formatResponse(false, 'Category nahi mili!'));
      }

      return res.status(200).json(formatResponse(true, 'Category details fetched', category));
    } catch (error) {
      next(error);
    }
  }

  // 3. Add New Category
  static async create(req, res, next) {
    try {
      const { name, description } = req.body;

      if (!name) {
        deleteUploadedFile(req.file);
        return res.status(400).json(formatResponse(false, 'Category name is required.'));
      }

      const existingCategory = await prisma.category.findUnique({ where: { name } });
      if (existingCategory) {
        deleteUploadedFile(req.file);
        return res.status(400).json(formatResponse(false, 'A category with this name already exists!'));
      }

      const imageUrl = req.file ? (req.file.relativeUrl || `/uploads/categories/${req.file.filename}`) : null;

      const category = await prisma.category.create({
        data: {
          name,
          description,
          imageUrl
        }
      });

      return res.status(201).json(formatResponse(true, 'Category created successfully! 🎉', category));
    } catch (error) {
      deleteUploadedFile(req.file);
      next(error);
    }
  }

  // 4. Update / Edit Category
  static async update(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const { name, description } = req.body;

      const category = await prisma.category.findUnique({ where: { id } });
      if (!category) {
        deleteUploadedFile(req.file);
        return res.status(404).json(formatResponse(false, 'Category not found!'));
      }

      const updateData = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (req.file) {
        updateData.imageUrl = req.file.relativeUrl || `/uploads/categories/${req.file.filename}`;
      } else if (req.body.imageUrl !== undefined) {
        updateData.imageUrl = req.body.imageUrl;
      }

      const updatedCategory = await prisma.category.update({
        where: { id },
        data: updateData
      });

      return res.status(200).json(formatResponse(true, 'Category updated successfully!', updatedCategory));
    } catch (error) {
      deleteUploadedFile(req.file);
      next(error);
    }
  }

  // 5. Delete Category (Checks products & subcategories)
  static async delete(req, res, next) {
    try {
      const id = parseInt(req.params.id);

      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          _count: { select: { products: true, subcategories: true } }
        }
      });

      if (!category) {
        return res.status(404).json(formatResponse(false, 'Category not found!'));
      }

      if (category._count.subcategories > 0) {
        return res.status(400).json(
          formatResponse(
            false,
            `Cannot delete category! This category contains ${category._count.subcategories} subcategories. Please reassign or delete them first.`
          )
        );
      }

      if (category._count.products > 0) {
        return res.status(400).json(
          formatResponse(
            false,
            `Cannot delete category! This category contains ${category._count.products} products.`
          )
        );
      }

      await prisma.category.delete({ where: { id } });

      return res.status(200).json(formatResponse(true, 'Category deleted successfully!'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CategoryController;
