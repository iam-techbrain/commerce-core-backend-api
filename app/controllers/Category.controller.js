const { prisma } = require('../database/Prisma.database');
const { formatResponse, deleteUploadedFile } = require('../helpers/App.helper');

class CategoryController {
  // 1. Get All Categories
  static async getAll(req, res, next) {
    try {
      const categories = await prisma.category.findMany({
        include: { _count: { select: { products: true } } }
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
        include: { products: true }
      });

      if (!category) {
        return res.status(404).json(formatResponse(false, 'Category nahi mili!'));
      }

      return res.status(200).json(formatResponse(true, 'Category details fetched', category));
    } catch (error) {
      next(error);
    }
  }

  // 3. Add New Category (With Image Cleanup on Validation Failure)
  static async create(req, res, next) {
    try {
      const { name, description } = req.body;

      if (!name) {
        deleteUploadedFile(req.file);
        return res.status(400).json(formatResponse(false, 'Category name zaroori hai.'));
      }

      const existingCategory = await prisma.category.findUnique({ where: { name } });
      if (existingCategory) {
        deleteUploadedFile(req.file);
        return res.status(400).json(formatResponse(false, 'Is name ki category pehle se exist karti hai!'));
      }

      const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

      const category = await prisma.category.create({
        data: {
          name,
          description,
          imageUrl
        }
      });

      return res.status(201).json(formatResponse(true, 'Category successfully create ho gayi! 🎉', category));
    } catch (error) {
      deleteUploadedFile(req.file);
      next(error);
    }
  }

  // 4. Update / Edit Category (With Image Cleanup on Failure)
  static async update(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const { name, description } = req.body;

      const category = await prisma.category.findUnique({ where: { id } });
      if (!category) {
        deleteUploadedFile(req.file);
        return res.status(404).json(formatResponse(false, 'Category nahi mili!'));
      }

      const updateData = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (req.file) updateData.imageUrl = `/uploads/${req.file.filename}`;

      const updatedCategory = await prisma.category.update({
        where: { id },
        data: updateData
      });

      return res.status(200).json(formatResponse(true, 'Category successfully update ho gayi!', updatedCategory));
    } catch (error) {
      deleteUploadedFile(req.file);
      next(error);
    }
  }

  // 5. Delete Category (🚫 CRITICAL VALIDATION: Products Check)
  static async delete(req, res, next) {
    try {
      const id = parseInt(req.params.id);

      const category = await prisma.category.findUnique({
        where: { id },
        include: { _count: { select: { products: true } } }
      });

      if (!category) {
        return res.status(404).json(formatResponse(false, 'Category nahi mili!'));
      }

      if (category._count.products > 0) {
        return res.status(400).json(
          formatResponse(
            false,
            `Category delete nahi ho sakti! Is category me ${category._count.products} products available hain. Pehle un products ko delete ya doosri category me move karein.`
          )
        );
      }

      await prisma.category.delete({ where: { id } });

      return res.status(200).json(formatResponse(true, 'Category successfully delete ho gayi!'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CategoryController;
