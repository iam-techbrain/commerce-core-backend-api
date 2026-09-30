const XLSX = require('xlsx');
const { prisma } = require('../database/Prisma.database');
const { formatResponse, deleteUploadedFile, downloadImageToLocal } = require('../helpers/App.helper');

class ProductController {
  // 1. Get All Products (With PAGINATION, Search, Filter, Sorting & Variants)
  static async getAll(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId) : undefined;
      const subCategoryId = req.query.subCategoryId ? parseInt(req.query.subCategoryId) : undefined;
      const brandId = req.query.brandId ? parseInt(req.query.brandId) : undefined;
      const sortBy = req.query.sortBy || 'createdAt';
      const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';

      const skip = (page - 1) * limit;

      const where = {
        ...(categoryId && { categoryId }),
        ...(subCategoryId && { subCategoryId }),
        ...(brandId && { brandId }),
        ...(search && {
          OR: [
            { name: { contains: search } },
            { description: { contains: search } },
            { brandName: { contains: search } }
          ]
        })
      };

      const totalCount = await prisma.product.count({ where });

      const products = await prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { category: true, subCategory: true, brand: true, variants: true }
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

      const formattedProducts = products.map((p) => {
        let specs = p.specifications;
        if (specs && typeof specs === 'string') {
          try { specs = JSON.parse(specs); } catch (e) {}
        }
        return { ...p, specifications: specs };
      });

      return res.status(200).json(
        formatResponse(true, 'Products fetched successfully with pagination', formattedProducts, null, pagination)
      );
    } catch (error) {
      next(error);
    }
  }

  // 2. Get Single Product by ID (With Variants & Reviews)
  static async getById(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          category: true,
          brand: true,
          variants: true,
          reviews: { include: { user: { select: { username: true } } } }
        }
      });

      if (!product) {
        return res.status(404).json(formatResponse(false, 'Product not found!'));
      }

      let parsedSpecs = product.specifications;
      if (parsedSpecs && typeof parsedSpecs === 'string') {
        try { parsedSpecs = JSON.parse(parsedSpecs); } catch (e) {}
      }

      return res.status(200).json(formatResponse(true, 'Product details fetched', { ...product, specifications: parsedSpecs }));
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
        include: { category: true, brand: true, variants: true },
        orderBy: { stock: 'asc' }
      });

      return res.status(200).json(
        formatResponse(true, `Low stock products fetched (Threshold <= ${threshold})`, lowStockProducts)
      );
    } catch (error) {
      next(error);
    }
  }

  // 4. Add New Product (Supports mrp, images JSON, hasVariants & variants)
  static async create(req, res, next) {
    try {
      const {
        name,
        sku,
        description,
        mrp,
        price,
        stock,
        categoryId,
        brandId,
        brandName,
        images,
        hasVariants,
        variants,
        countryOfOrigin,
        warranty,
        specifications
      } = req.body;

      if (!name || price === undefined || !categoryId) {
        deleteUploadedFile(req.file);
        return res.status(400).json(formatResponse(false, 'Product name, price, and categoryId are required.'));
      }

      const categoryExists = await prisma.category.findUnique({
        where: { id: parseInt(categoryId) }
      });

      if (!categoryExists) {
        deleteUploadedFile(req.file);
        return res.status(404).json(formatResponse(false, 'The provided Category ID does not exist!'));
      }

      let parsedBrandId = brandId ? parseInt(brandId) : null;
      let finalBrandName = brandName || null;

      if (parsedBrandId) {
        const brandObj = await prisma.brand.findUnique({ where: { id: parsedBrandId } });
        if (brandObj) {
          finalBrandName = brandObj.name;
        } else {
          parsedBrandId = null;
        }
      }

      const shouldDownload = req.body.downloadImages === true || req.body.downloadImages === 'true';

      let imageUrl = req.file
        ? (req.file.relativeUrl || `/uploads/products/${req.file.filename}`)
        : req.body.imageUrl || null;

      if (shouldDownload && imageUrl && imageUrl.startsWith('http')) {
        imageUrl = await downloadImageToLocal(imageUrl);
      }

      let imagesArray = [];
      if (images) {
        imagesArray = typeof images === 'string' ? JSON.parse(images) : images;
        if (!Array.isArray(imagesArray)) imagesArray = [imagesArray];
      } else if (imageUrl) {
        imagesArray = [imageUrl];
      }

      if (shouldDownload && imagesArray.length > 0) {
        imagesArray = await Promise.all(imagesArray.map((u) => downloadImageToLocal(u)));
        if (!imageUrl) imageUrl = imagesArray[0];
      }

      const imagesJson = imagesArray.length > 0 ? JSON.stringify(imagesArray) : null;

      const parsedHasVariants = hasVariants === true || hasVariants === 'true';

      let specsObj = {};
      if (specifications) {
        try {
          specsObj = typeof specifications === 'string' ? JSON.parse(specifications) : specifications;
        } catch (e) {}
      }
      if (countryOfOrigin && !specsObj['Country of Origin']) {
        specsObj['Country of Origin'] = countryOfOrigin;
      }
      if (warranty && !specsObj['Warranty']) {
        specsObj['Warranty'] = warranty;
      }
      const specificationsJson = Object.keys(specsObj).length > 0 ? JSON.stringify(specsObj) : null;

      const product = await prisma.product.create({
        data: {
          name,
          sku: sku || `SKU-${Date.now()}`,
          description: description || null,
          mrp: mrp ? parseFloat(mrp) : null,
          price: parseFloat(price),
          stock: stock ? parseInt(stock) : 0,
          imageUrl,
          images: imagesJson,
          hasVariants: parsedHasVariants,
          categoryId: parseInt(categoryId),
          brandId: parsedBrandId,
          brandName: finalBrandName,
          specifications: specificationsJson
        },
        include: { category: true, brand: true }
      });

      // Handle variants if provided
      if (parsedHasVariants && variants) {
        const parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
        if (Array.isArray(parsedVariants) && parsedVariants.length > 0) {
          for (const v of parsedVariants) {
            let varImage = v.imageUrl || null;
            if (shouldDownload && varImage && varImage.startsWith('http')) {
              varImage = await downloadImageToLocal(varImage);
            }
            const attrs = v.attributes ? (typeof v.attributes === 'string' ? v.attributes : JSON.stringify(v.attributes)) : null;
            await prisma.productVariant.create({
              data: {
                productId: product.id,
                sku: v.sku || `VAR-${product.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                title: v.title || 'Standard Variant',
                attributes: attrs,
                mrp: v.mrp ? parseFloat(v.mrp) : null,
                price: parseFloat(v.price || product.price),
                stock: v.stock !== undefined ? parseInt(v.stock) : 0,
                imageUrl: varImage
              }
            });
          }
        }
      }

      const fullProduct = await prisma.product.findUnique({
        where: { id: product.id },
        include: { category: true, brand: true, variants: true }
      });

      return res.status(201).json(formatResponse(true, 'Product created successfully! 📦', fullProduct));
    } catch (error) {
      deleteUploadedFile(req.file);
      next(error);
    }
  }

  // 5. Update / Edit Product
  static async update(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const {
        name,
        sku,
        description,
        mrp,
        price,
        stock,
        categoryId,
        subCategoryId,
        brandId,
        brandName,
        images,
        hasVariants,
        countryOfOrigin,
        warranty,
        specifications
      } = req.body;

      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) {
        deleteUploadedFile(req.file);
        return res.status(404).json(formatResponse(false, 'Product not found!'));
      }

      if (categoryId) {
        const categoryExists = await prisma.category.findUnique({ where: { id: parseInt(categoryId) } });
        if (!categoryExists) {
          deleteUploadedFile(req.file);
          return res.status(404).json(formatResponse(false, 'Category ID does not exist!'));
        }
      }

      const updateData = {};
      if (name) updateData.name = name;
      if (sku) updateData.sku = sku;
      if (description !== undefined) updateData.description = description;
      if (mrp !== undefined) updateData.mrp = mrp ? parseFloat(mrp) : null;
      if (price !== undefined) updateData.price = parseFloat(price);
      if (stock !== undefined) updateData.stock = parseInt(stock);
      if (categoryId !== undefined) updateData.categoryId = parseInt(categoryId);
      if (subCategoryId !== undefined) {
        if (subCategoryId === '' || subCategoryId === null || subCategoryId === 'null') {
          updateData.subCategoryId = null;
        } else {
          updateData.subCategoryId = parseInt(subCategoryId);
        }
      }
      if (hasVariants !== undefined) updateData.hasVariants = hasVariants === true || hasVariants === 'true';
      if (specifications !== undefined) {
        let specsJson = specifications;
        if (typeof specifications === 'object' && specifications !== null) {
          specsJson = JSON.stringify(specifications);
        }
        updateData.specifications = specsJson;
      }

      if (brandId !== undefined) {
        if (brandId === '' || brandId === null || brandId === 'null') {
          updateData.brandId = null;
          updateData.brandName = null;
        } else {
          const parsedBrandId = parseInt(brandId);
          const brandObj = await prisma.brand.findUnique({ where: { id: parsedBrandId } });
          if (brandObj) {
            updateData.brandId = parsedBrandId;
            updateData.brandName = brandObj.name;
          }
        }
      } else if (brandName !== undefined) {
        updateData.brandName = brandName;
      }

      const shouldDownload = req.body.downloadImages === true || req.body.downloadImages === 'true';

      if (req.file) {
        updateData.imageUrl = req.file.relativeUrl || `/uploads/products/${req.file.filename}`;
      } else if (req.body.imageUrl) {
        let finalImg = req.body.imageUrl;
        if (shouldDownload && finalImg.startsWith('http')) {
          finalImg = await downloadImageToLocal(finalImg);
        }
        updateData.imageUrl = finalImg;
      }

      if (images !== undefined) {
        let imgs = typeof images === 'string' ? JSON.parse(images) : images;
        if (Array.isArray(imgs) && shouldDownload) {
          imgs = await Promise.all(imgs.map((u) => downloadImageToLocal(u)));
        }
        updateData.images = JSON.stringify(imgs);
      }

      const updatedProduct = await prisma.product.update({
        where: { id },
        data: updateData,
        include: { category: true, subCategory: true, brand: true, variants: true }
      });

      return res.status(200).json(formatResponse(true, 'Product updated successfully!', updatedProduct));
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
        return res.status(404).json(formatResponse(false, 'Product not found!'));
      }

      await prisma.product.delete({ where: { id } });

      return res.status(200).json(formatResponse(true, 'Product deleted successfully!'));
    } catch (error) {
      next(error);
    }
  }

  // 7. Bulk Upload Products from Excel / CSV (Max 50 rows per batch)
  static async bulkUpload(req, res, next) {
    try {
      let rows = [];

      if (req.file && req.file.buffer) {
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        rows = XLSX.utils.sheet_to_json(sheet);
      } else if (req.body.products && Array.isArray(req.body.products)) {
        rows = req.body.products;
      } else {
        return res.status(400).json(formatResponse(false, 'Please upload an Excel/CSV file!'));
      }

      if (!rows || rows.length === 0) {
        return res.status(400).json(formatResponse(false, 'No data found in the Excel file!'));
      }

      // Strict Validation: Max 50 products per batch
      if (rows.length > 50) {
        return res.status(400).json(
          formatResponse(
            false,
            `Batch Limit Exceeded! Maximum 50 products can be uploaded at a time. Your file contains ${rows.length} rows. Please upload in batches of 50.`
          )
        );
      }

      const results = [];
      const parentGroups = new Map();

      // Step 1: Pre-process rows and group variants if productHandle or parentSku is provided
      for (const row of rows) {
        const handle = row.productHandle || row.parentSku || row.handle || null;
        if (handle) {
          if (!parentGroups.has(handle)) {
            parentGroups.set(handle, []);
          }
          parentGroups.get(handle).push(row);
        }
      }

      // Helper function to resolve category ID
      const resolveCategory = async (catName) => {
        const trimmed = (catName || 'Sports Equipment').trim();
        const existing = await prisma.category.findFirst({
          where: { name: { equals: trimmed } }
        });
        if (existing) return existing.id;
        const created = await prisma.category.create({
          data: { name: trimmed, description: `${trimmed} sports catalog category` }
        });
        return created.id;
      };

      // Helper function to resolve brand ID
      const resolveBrand = async (brandName) => {
        if (!brandName) return { id: null, name: null };
        const trimmed = brandName.trim();
        const existing = await prisma.brand.findFirst({
          where: { name: { equals: trimmed } }
        });
        if (existing) return { id: existing.id, name: existing.name };
        const created = await prisma.brand.create({
          data: { name: trimmed }
        });
        return { id: created.id, name: created.name };
      };

      // Helper function to extract dynamic attributes from row (Weight, Height, Size, Color, etc.)
      const extractRowAttributes = (r) => {
        const attrs = {};
        // 1. Check option1_name / option1_value pattern (Shopify / Enterprise standard)
        for (let i = 1; i <= 3; i++) {
          const optName = r[`option${i}_name`] || r[`option${i}`] || r[`Option${i} Name`] || r[`Option ${i} Name`];
          const optVal = r[`option${i}_value`] || r[`value${i}`] || r[`Option${i} Value`] || r[`Option ${i} Value`];
          if (optName && optVal) {
            attrs[String(optName).trim()] = String(optVal).trim();
          }
        }

        // 2. Also check direct dynamic column names
        const commonKeys = ['weight', 'height', 'size', 'color', 'handle', 'tension', 'material', 'thickness', 'flavour', 'dimensions'];
        for (const col of Object.keys(r)) {
          const cleanCol = col.toLowerCase().trim();
          if (commonKeys.includes(cleanCol) && r[col]) {
            const capitalized = cleanCol.charAt(0).toUpperCase() + cleanCol.slice(1);
            if (!attrs[capitalized]) {
              attrs[capitalized] = String(r[col]).trim();
            }
          }
        }
        return attrs;
      };

      const formatVariantTitle = (r, attrs) => {
        if (r.variantTitle || r.title) return String(r.variantTitle || r.title).trim();
        const vals = Object.values(attrs);
        if (vals.length > 0) return vals.join(' / ');
        return 'Standard';
      };

      const shouldDownload = req.body.downloadImages === true || req.body.downloadImages === 'true' || req.query.downloadImages === 'true';

      // Process grouped variant products first
      const processedHandles = new Set();
      for (const [handle, variantRows] of parentGroups.entries()) {
        processedHandles.add(handle);
        const baseRow = variantRows[0];
        const categoryId = await resolveCategory(baseRow.category || baseRow.categoryName);
        const brand = await resolveBrand(baseRow.brand || baseRow.brandName);

        // Process images (first image is primary cover, all images stored in JSON array)
        let gallery = [];
        if (baseRow.images) {
          gallery = String(baseRow.images).split(',').map((u) => u.trim()).filter(Boolean);
        } else if (baseRow.imageUrl || baseRow.image) {
          gallery = [baseRow.imageUrl || baseRow.image];
        }

        if (shouldDownload && gallery.length > 0) {
          gallery = await Promise.all(gallery.map((u) => downloadImageToLocal(u)));
        }

        const primaryImage = gallery[0] || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=500';

        // Calculate min price and total stock across variants
        const prices = variantRows.map((r) => parseFloat(r.price) || 0).filter((p) => p > 0);
        const minPrice = prices.length > 0 ? Math.min(...prices) : (parseFloat(baseRow.price) || 999);
        const totalStock = variantRows.reduce((sum, r) => sum + (parseInt(r.stock) || 0), 0);

        const product = await prisma.product.create({
          data: {
            name: baseRow.name || 'Sports Product',
            sku: handle,
            description: baseRow.description || null,
            mrp: baseRow.mrp ? parseFloat(baseRow.mrp) : null,
            price: minPrice,
            stock: totalStock,
            imageUrl: primaryImage,
            images: JSON.stringify(gallery),
            hasVariants: true,
            categoryId,
            brandId: brand.id,
            brandName: brand.name
          }
        });

        // Create variants with dynamic attributes
        for (const vr of variantRows) {
          const attrs = extractRowAttributes(vr);
          const varTitle = formatVariantTitle(vr, attrs);
          let varImage = vr.variantImage || vr.variantImageUrl || null;
          if (shouldDownload && varImage && varImage.startsWith('http')) {
            varImage = await downloadImageToLocal(varImage);
          }

          await prisma.productVariant.create({
            data: {
              productId: product.id,
              sku: vr.sku || `VAR-${handle}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              title: varTitle,
              attributes: Object.keys(attrs).length > 0 ? JSON.stringify(attrs) : null,
              mrp: vr.mrp ? parseFloat(vr.mrp) : null,
              price: parseFloat(vr.price) || minPrice,
              stock: parseInt(vr.stock) || 0,
              imageUrl: varImage
            }
          });
        }

        results.push(product);
      }

      // Process single non-grouped rows
      for (const row of rows) {
        const handle = row.productHandle || row.parentSku || row.handle || null;
        if (handle && processedHandles.has(handle)) {
          continue; // Already processed in variant group
        }

        if (!row.name) continue;

        const categoryId = await resolveCategory(row.category || row.categoryName);
        const brand = await resolveBrand(row.brand || row.brandName);

        let gallery = [];
        if (row.images) {
          gallery = String(row.images).split(',').map((u) => u.trim()).filter(Boolean);
        } else if (row.imageUrl || row.image) {
          gallery = [row.imageUrl || row.image];
        }

        if (shouldDownload && gallery.length > 0) {
          gallery = await Promise.all(gallery.map((u) => downloadImageToLocal(u)));
        }

        const primaryImage = gallery[0] || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=500';
        const attrs = extractRowAttributes(row);
        const hasVariantFields = Object.keys(attrs).length > 0;

        const product = await prisma.product.create({
          data: {
            name: row.name,
            sku: row.sku || `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            description: row.description || null,
            mrp: row.mrp ? parseFloat(row.mrp) : null,
            price: parseFloat(row.price) || 999,
            stock: row.stock ? parseInt(row.stock) : 0,
            imageUrl: primaryImage,
            images: JSON.stringify(gallery),
            hasVariants: hasVariantFields,
            categoryId,
            brandId: brand.id,
            brandName: brand.name
          }
        });

        if (hasVariantFields) {
          const varTitle = formatVariantTitle(row, attrs);
          let varImage = row.variantImage || row.variantImageUrl || null;
          if (shouldDownload && varImage && varImage.startsWith('http')) {
            varImage = await downloadImageToLocal(varImage);
          }

          await prisma.productVariant.create({
            data: {
              productId: product.id,
              sku: `VAR-${product.id}-1`,
              title: varTitle,
              attributes: JSON.stringify(attrs),
              mrp: row.mrp ? parseFloat(row.mrp) : null,
              price: parseFloat(row.price) || 999,
              stock: row.stock ? parseInt(row.stock) : 0,
              imageUrl: varImage
            }
          });
        }

        results.push(product);
      }

      return res.status(201).json(
        formatResponse(true, `🎉 Shandaar! Total ${results.length} products successfully import aur live ho gaye!`, {
          count: results.length,
          products: results
        })
      );
    } catch (error) {
      next(error);
    }
  }

  // 8. Download Sample Excel Template
  static async getSampleTemplate(req, res, next) {
    try {
      const sampleData = [
        {
          productHandle: 'YONEX-ASTROX-88D',
          name: 'Yonex Astrox 88D Pro Badminton Racquet',
          category: 'Badminton & Racquets',
          brand: 'Yonex',
          sku: 'YNX-88DP-4U5',
          option1_name: 'Weight / Grip',
          option1_value: '4U / G5',
          option2_name: 'Color',
          option2_value: 'Black/Ruby',
          mrp: 17999,
          price: 14999,
          stock: 20,
          description: 'Head heavy professional backcourt offensive racquet',
          images: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600, https://images.unsplash.com/photo-1595435742656-5272d0b3fa82?w=600',
          variantImage: ''
        },
        {
          productHandle: 'YONEX-ASTROX-88D',
          name: 'Yonex Astrox 88D Pro Badminton Racquet',
          category: 'Badminton & Racquets',
          brand: 'Yonex',
          sku: 'YNX-88DP-3U4',
          option1_name: 'Weight / Grip',
          option1_value: '3U / G4',
          option2_name: 'Color',
          option2_value: 'Black/Ruby',
          mrp: 17999,
          price: 15499,
          stock: 12,
          description: 'Head heavy professional backcourt offensive racquet',
          images: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600',
          variantImage: ''
        },
        {
          productHandle: 'COSCO-HEX-DUMBBELL',
          name: 'Cosco Professional Rubber Hex Dumbbell (Pair)',
          category: 'Gym & Fitness Gear',
          brand: 'Cosco',
          sku: 'COS-HEX-10KG',
          option1_name: 'Weight',
          option1_value: '10kg (Pair)',
          option2_name: '',
          option2_value: '',
          mrp: 4999,
          price: 3999,
          stock: 15,
          description: 'Heavy duty hex rubber dumbbells for high performance training',
          images: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600',
          variantImage: ''
        },
        {
          productHandle: 'COSCO-HEX-DUMBBELL',
          name: 'Cosco Professional Rubber Hex Dumbbell (Pair)',
          category: 'Gym & Fitness Gear',
          brand: 'Cosco',
          sku: 'COS-HEX-20KG',
          option1_name: 'Weight',
          option1_value: '20kg (Pair)',
          option2_name: '',
          option2_value: '',
          mrp: 7999,
          price: 6499,
          stock: 10,
          description: 'Heavy duty hex rubber dumbbells for high performance training',
          images: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600',
          variantImage: ''
        },
        {
          productHandle: 'PRO-YOGA-MAT',
          name: 'Chhabra Anti-Skid Pro Fitness Yoga Mat',
          category: 'Gym & Fitness Gear',
          brand: 'Cosco',
          sku: 'MAT-8MM-6FT',
          option1_name: 'Thickness',
          option1_value: '8mm',
          option2_name: 'Height / Length',
          option2_value: '6ft',
          mrp: 2499,
          price: 1799,
          stock: 30,
          description: 'High-density anti-tear cushioning yoga mat',
          images: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600',
          variantImage: ''
        },
        {
          productHandle: '',
          name: 'Asics Gel-Rocket 11 Court Shoes',
          category: 'Non-Marking Court Shoes',
          brand: 'Asics',
          sku: 'ASC-GEL-R11',
          option1_name: 'Size',
          option1_value: 'UK 8',
          option2_name: 'Color',
          option2_value: 'White/Deep Blue',
          mrp: 6999,
          price: 5499,
          stock: 25,
          description: 'Gel cushioning indoor non-marking court shoes',
          images: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600',
          variantImage: ''
        }
      ];

      const worksheet = XLSX.utils.json_to_sheet(sampleData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Disposition', 'attachment; filename="chhabra_sports_products_template.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      return res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  // 9. Add Variant to an Existing Product (Protected Admin)
  static async addVariant(req, res, next) {
    try {
      const productId = parseInt(req.params.id);
      const { title, attributes, mrp, price, stock, imageUrl, sku, downloadImages } = req.body;

      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { variants: true }
      });

      if (!product) {
        return res.status(404).json(formatResponse(false, 'Product not found!'));
      }

      if (price === undefined || price === null || price === '') {
        return res.status(400).json(formatResponse(false, 'Variant price is required.'));
      }

      let varImage = imageUrl ? imageUrl.trim() : null;
      const shouldDownload = downloadImages === true || downloadImages === 'true';
      if (shouldDownload && varImage && varImage.startsWith('http')) {
        varImage = await downloadImageToLocal(varImage);
      }

      const attrs = attributes
        ? (typeof attributes === 'string' ? attributes : JSON.stringify(attributes))
        : null;

      const variantTitle = title || 'Standard Variant';
      const variantSku = sku || `VAR-${productId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const createdVariant = await prisma.productVariant.create({
        data: {
          productId,
          sku: variantSku,
          title: variantTitle,
          attributes: attrs,
          mrp: mrp ? parseFloat(mrp) : null,
          price: parseFloat(price),
          stock: stock !== undefined ? parseInt(stock) : 0,
          imageUrl: varImage
        }
      });

      // Update parent product: ensure hasVariants is true and adjust total stock
      await prisma.product.update({
        where: { id: productId },
        data: {
          hasVariants: true,
          stock: { increment: parseInt(stock || 0) }
        }
      });

      const updatedProduct = await prisma.product.findUnique({
        where: { id: productId },
        include: { category: true, brand: true, variants: true }
      });

      return res.status(201).json(
        formatResponse(true, `Variant "${variantTitle}" added successfully! 🎉`, {
          variant: createdVariant,
          product: updatedProduct
        })
      );
    } catch (error) {
      next(error);
    }
  }

  // 10. Update an Existing Variant
  static async updateVariant(req, res, next) {
    try {
      const variantId = parseInt(req.params.variantId);
      const { title, attributes, mrp, price, stock, imageUrl, sku } = req.body;

      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId }
      });

      if (!variant) {
        return res.status(404).json(formatResponse(false, 'Variant not found!'));
      }

      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (sku !== undefined) updateData.sku = sku;
      if (mrp !== undefined) updateData.mrp = mrp ? parseFloat(mrp) : null;
      if (price !== undefined) updateData.price = parseFloat(price);
      if (stock !== undefined) updateData.stock = parseInt(stock);
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl ? imageUrl.trim() : null;
      if (attributes !== undefined) {
        updateData.attributes = typeof attributes === 'string' ? attributes : JSON.stringify(attributes);
      }

      const updatedVariant = await prisma.productVariant.update({
        where: { id: variantId },
        data: updateData
      });

      return res.status(200).json(
        formatResponse(true, 'Variant updated successfully!', updatedVariant)
      );
    } catch (error) {
      next(error);
    }
  }

  // 11. Delete a Variant
  static async deleteVariant(req, res, next) {
    try {
      const variantId = parseInt(req.params.variantId);

      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId }
      });

      if (!variant) {
        return res.status(404).json(formatResponse(false, 'Variant not found!'));
      }

      await prisma.productVariant.delete({
        where: { id: variantId }
      });

      // Check if product still has variants
      const remainingCount = await prisma.productVariant.count({
        where: { productId: variant.productId }
      });

      if (remainingCount === 0) {
        await prisma.product.update({
          where: { id: variant.productId },
          data: { hasVariants: false }
        });
      }

      return res.status(200).json(
        formatResponse(true, 'Variant deleted successfully!')
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProductController;
