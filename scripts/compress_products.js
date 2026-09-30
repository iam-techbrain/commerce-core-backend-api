const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const productsDir = path.join(__dirname, '..', 'public', 'uploads', 'products');

async function compressAllExistingImages() {
  console.log('🚀 Starting Existing Product Image Compression...');

  if (!fs.existsSync(productsDir)) {
    console.error('Directory does not exist:', productsDir);
    return;
  }

  const files = fs.readdirSync(productsDir);
  console.log(`Found ${files.length} files in ${productsDir}`);

  let totalOriginalSize = 0;
  let totalNewSize = 0;
  let compressedCount = 0;
  const nameMapping = {}; // oldFileName -> newWebpFileName

  for (const file of files) {
    const filePath = path.join(productsDir, file);
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) continue;

    const ext = path.extname(file).toLowerCase();
    // Only compress standard images (png, jpg, jpeg)
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
      continue;
    }

    const baseName = path.basename(file, ext);
    const webpFileName = `${baseName}.webp`;
    const webpFilePath = path.join(productsDir, webpFileName);

    const originalSize = stat.size;
    totalOriginalSize += originalSize;

    try {
      // Compress and resize max 1000px, WebP quality 78
      await sharp(filePath)
        .resize({ width: 1000, height: 1000, fit: sharp.fit.inside, withoutEnlargement: true })
        .webp({ quality: 78, effort: 4 })
        .toFile(webpFilePath);

      const newStat = fs.statSync(webpFilePath);
      totalNewSize += newStat.size;
      compressedCount++;

      nameMapping[file] = webpFileName;
      nameMapping[`/uploads/products/${file}`] = `/uploads/products/${webpFileName}`;

      // Delete the heavy old file if it has a different name
      if (filePath !== webpFilePath) {
        fs.unlinkSync(filePath);
      }

      console.log(`✓ [${file}] (${(originalSize / 1024).toFixed(1)} KB) -> [${webpFileName}] (${(newStat.size / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`❌ Failed to compress ${file}:`, err.message);
    }
  }

  console.log('\n📊 Updating Database References...');
  const products = await prisma.product.findMany();
  let dbUpdates = 0;

  for (const prod of products) {
    let changed = false;
    let newImageUrl = prod.imageUrl;
    let newImages = prod.images;

    // Check primary imageUrl
    if (newImageUrl && nameMapping[newImageUrl]) {
      newImageUrl = nameMapping[newImageUrl];
      changed = true;
    }

    // Check gallery images JSON
    if (newImages) {
      try {
        const parsed = JSON.parse(newImages);
        if (Array.isArray(parsed)) {
          let arrayChanged = false;
          const updatedArray = parsed.map(img => {
            if (nameMapping[img]) {
              arrayChanged = true;
              return nameMapping[img];
            }
            return img;
          });
          if (arrayChanged) {
            newImages = JSON.stringify(updatedArray);
            changed = true;
          }
        }
      } catch (e) {
        // Not a JSON string or couldn't parse
      }
    }

    if (changed) {
      await prisma.product.update({
        where: { id: prod.id },
        data: {
          imageUrl: newImageUrl,
          images: newImages
        }
      });
      dbUpdates++;
    }
  }

  // Update variants if any exist
  const variants = await prisma.productVariant.findMany();
  let variantUpdates = 0;
  for (const v of variants) {
    if (v.imageUrl && nameMapping[v.imageUrl]) {
      await prisma.productVariant.update({
        where: { id: v.id },
        data: { imageUrl: nameMapping[v.imageUrl] }
      });
      variantUpdates++;
    }
  }

  console.log('\n====================================');
  console.log(`🎉 Compression Complete!`);
  console.log(`• Files Processed: ${compressedCount}`);
  console.log(`• Original Size: ${(totalOriginalSize / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`• Optimized Size: ${(totalNewSize / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`• Saved: ${(((totalOriginalSize - totalNewSize) / totalOriginalSize) * 100).toFixed(1)}% bandwidth!`);
  console.log(`• Database Products Updated: ${dbUpdates}`);
  console.log(`• Database Variants Updated: ${variantUpdates}`);
  console.log('====================================\n');
}

compressAllExistingImages()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
