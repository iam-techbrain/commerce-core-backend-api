const { prisma } = require('../database/Prisma.database');
const { formatResponse, deleteUploadedFile } = require('../helpers/App.helper');

class SubCategoryController {
  // 1. Get All SubCategories (supports optional categoryId filter)
  static async getAll(req, res, next) {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId) : undefined;
      const where = categoryId ? { categoryId } : {};

      const subcategories = await prisma.subCategory.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          _count: { select: { products: true } }
        },
        orderBy: { name: 'asc' }
      });

      return res.status(200).json(formatResponse(true, 'Subcategories fetched successfully', subcategories));
    } catch (error) {
      next(error);
    }
  }

  // 2. Get Single SubCategory by ID
  static async getById(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const subCategory = await prisma.subCategory.findUnique({
        where: { id },
        include: {
          category: true,
          products: { include: { brand: true, variants: true } }
        }
      });

      if (!subCategory) {
        return res.status(404).json(formatResponse(false, 'Subcategory nahi mili!'));
      }

      return res.status(200).json(formatResponse(true, 'Subcategory details fetched', subCategory));
    } catch (error) {
      next(error);
    }
  }

  // 3. Create SubCategory
  static async create(req, res, next) {
    try {
      const { name, description, categoryId } = req.body;

      if (!name || !categoryId) {
        deleteUploadedFile(req.file);
        return res.status(400).json(formatResponse(false, 'Subcategory name aur categoryId dono zaroori hain.'));
      }

      const parsedCategoryId = parseInt(categoryId);
      const parentCategory = await prisma.category.findUnique({ where: { id: parsedCategoryId } });
      if (!parentCategory) {
        deleteUploadedFile(req.file);
        return res.status(400).json(formatResponse(false, 'Parent Category nahi mili!'));
      }

      const existingSub = await prisma.subCategory.findUnique({ where: { name } });
      if (existingSub) {
        deleteUploadedFile(req.file);
        return res.status(400).json(formatResponse(false, 'Is name ki subcategory pehle se exist karti hai!'));
      }

      const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

      const subCategory = await prisma.subCategory.create({
        data: {
          name,
          description,
          categoryId: parsedCategoryId,
          imageUrl
        },
        include: { category: { select: { id: true, name: true } } }
      });

      return res.status(201).json(formatResponse(true, 'Subcategory successfully create ho gayi! 🎉', subCategory));
    } catch (error) {
      deleteUploadedFile(req.file);
      next(error);
    }
  }

  // 4. Update SubCategory
  static async update(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const { name, description, categoryId } = req.body;

      const subCategory = await prisma.subCategory.findUnique({ where: { id } });
      if (!subCategory) {
        deleteUploadedFile(req.file);
        return res.status(404).json(formatResponse(false, 'Subcategory nahi mili!'));
      }

      const updateData = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (req.file) updateData.imageUrl = `/uploads/${req.file.filename}`;
      if (categoryId) {
        const pId = parseInt(categoryId);
        const parentCategory = await prisma.category.findUnique({ where: { id: pId } });
        if (!parentCategory) {
          deleteUploadedFile(req.file);
          return res.status(400).json(formatResponse(false, 'Parent Category nahi mili!'));
        }
        updateData.categoryId = pId;
      }

      const updatedSub = await prisma.subCategory.update({
        where: { id },
        data: updateData,
        include: { category: { select: { id: true, name: true } } }
      });

      return res.status(200).json(formatResponse(true, 'Subcategory successfully update ho gayi!', updatedSub));
    } catch (error) {
      deleteUploadedFile(req.file);
      next(error);
    }
  }

  // 5. Delete SubCategory
  static async delete(req, res, next) {
    try {
      const id = parseInt(req.params.id);

      const subCategory = await prisma.subCategory.findUnique({
        where: { id },
        include: { _count: { select: { products: true } } }
      });

      if (!subCategory) {
        return res.status(404).json(formatResponse(false, 'Subcategory nahi mili!'));
      }

      if (subCategory._count.products > 0) {
        return res.status(400).json(
          formatResponse(
            false,
            `Subcategory delete nahi ho sakti! Isme ${subCategory._count.products} products available hain.`
          )
        );
      }

      await prisma.subCategory.delete({ where: { id } });

      return res.status(200).json(formatResponse(true, 'Subcategory successfully delete ho gayi!'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SubCategoryController;
