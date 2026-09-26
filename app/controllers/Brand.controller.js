const { prisma } = require('../database/Prisma.database');
const { formatResponse, deleteUploadedFile } = require('../helpers/App.helper');

class BrandController {
  // 1. Get All Brands
  static async getAll(req, res, next) {
    try {
      const brands = await prisma.brand.findMany({
        include: { _count: { select: { products: true } } },
        orderBy: { name: 'asc' }
      });
      return res.status(200).json(formatResponse(true, 'Brands fetched successfully', brands));
    } catch (error) {
      next(error);
    }
  }

  // 2. Get Single Brand by ID
  static async getById(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const brand = await prisma.brand.findUnique({
        where: { id },
        include: { products: true }
      });

      if (!brand) {
        return res.status(404).json(formatResponse(false, 'Brand nahi mila!'));
      }

      return res.status(200).json(formatResponse(true, 'Brand details fetched', brand));
    } catch (error) {
      next(error);
    }
  }

  // 3. Add New Brand
  static async create(req, res, next) {
    try {
      const { name, description } = req.body;

      if (!name) {
        deleteUploadedFile(req.file);
        return res.status(400).json(formatResponse(false, 'Brand name zaroori hai.'));
      }

      const existingBrand = await prisma.brand.findUnique({ where: { name } });
      if (existingBrand) {
        deleteUploadedFile(req.file);
        return res.status(400).json(formatResponse(false, 'Is name ka brand pehle se exist karta hai!'));
      }

      const logoUrl = req.file ? `/uploads/${req.file.filename}` : null;

      const brand = await prisma.brand.create({
        data: {
          name,
          description,
          logoUrl
        }
      });

      return res.status(201).json(formatResponse(true, 'Brand successfully create ho gaya! 🏷️', brand));
    } catch (error) {
      deleteUploadedFile(req.file);
      next(error);
    }
  }

  // 4. Update Brand
  static async update(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const { name, description } = req.body;

      const brand = await prisma.brand.findUnique({ where: { id } });
      if (!brand) {
        deleteUploadedFile(req.file);
        return res.status(404).json(formatResponse(false, 'Brand nahi mila!'));
      }

      const updateData = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (req.file) updateData.logoUrl = `/uploads/${req.file.filename}`;

      const updatedBrand = await prisma.brand.update({
        where: { id },
        data: updateData
      });

      return res.status(200).json(formatResponse(true, 'Brand successfully update ho gaya!', updatedBrand));
    } catch (error) {
      deleteUploadedFile(req.file);
      next(error);
    }
  }

  // 5. Delete Brand
  static async delete(req, res, next) {
    try {
      const id = parseInt(req.params.id);

      const brand = await prisma.brand.findUnique({
        where: { id },
        include: { _count: { select: { products: true } } }
      });

      if (!brand) {
        return res.status(404).json(formatResponse(false, 'Brand nahi mila!'));
      }

      if (brand._count.products > 0) {
        return res.status(400).json(
          formatResponse(
            false,
            `Brand delete nahi ho sakta! Is brand me ${brand._count.products} products attached hain. Pehle un products ka brand change karein ya delete karein.`
          )
        );
      }

      await prisma.brand.delete({ where: { id } });

      return res.status(200).json(formatResponse(true, 'Brand successfully delete ho gaya!'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = BrandController;
