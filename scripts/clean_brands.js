const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const brandsDir = path.join(__dirname, '..', 'public', 'uploads', 'brands');

async function cleanAndRenameBrandLogos() {
  console.log('🚀 Starting Brand Logo Cleanup and Renaming...');

  // 1. Fetch all brands
  const brands = await prisma.brand.findMany({
    include: { _count: { select: { products: true } } }
  });

  console.log(`Found ${brands.length} brands in database.`);

  const validNewFiles = new Set();

  for (const b of brands) {
    const cleanBrandName = b.name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');
    const newFileName = `${cleanBrandName}.webp`;
    const newRelativeUrl = `/uploads/brands/${newFileName}`;
    const newFilePath = path.join(brandsDir, newFileName);

    let currentFileName = null;
    let currentFilePath = null;

    if (b.logoUrl) {
      currentFileName = path.basename(b.logoUrl);
      currentFilePath = path.join(brandsDir, currentFileName);
    }

    // Try finding the actual existing file for this brand
    let sourcePath = null;
    if (currentFilePath && fs.existsSync(currentFilePath)) {
      sourcePath = currentFilePath;
    } else {
      // Check if a file named after the brand exists (e.g. nike.png, adidas.jpg, etc.)
      const possibleExtensions = ['.webp', '.png', '.jpg', '.jpeg', '.svg'];
      for (const ext of possibleExtensions) {
        const candidate = path.join(brandsDir, `${cleanBrandName}${ext}`);
        if (fs.existsSync(candidate)) {
          sourcePath = candidate;
          break;
        }
      }
    }

    if (sourcePath && fs.existsSync(sourcePath)) {
      // If the file is not already the target file, move/rename it
      if (sourcePath !== newFilePath) {
        fs.copyFileSync(sourcePath, newFilePath);
        if (sourcePath !== newFilePath) {
          try { fs.unlinkSync(sourcePath); } catch (e) {}
        }
        console.log(`✨ Renamed logo for brand [${b.name}]: ${path.basename(sourcePath)} -> ${newFileName}`);
      } else {
        console.log(`✓ Logo already named correctly for [${b.name}]: ${newFileName}`);
      }

      validNewFiles.add(newFileName);

      // Update database if name or path changed
      await prisma.brand.update({
        where: { id: b.id },
        data: {
          name: b.name.trim(), // Trim trailing spaces like "NIKE " -> "NIKE"
          logoUrl: newRelativeUrl
        }
      });
    } else {
      console.warn(`⚠️ No physical logo file found for brand [${b.name}] (URL was ${b.logoUrl})`);
    }
  }

  // 2. Remove all unused files in public/uploads/brands/
  console.log('\n🧹 Cleaning unused files from public/uploads/brands/ ...');
  const allFiles = fs.readdirSync(brandsDir);
  let deletedCount = 0;

  for (const file of allFiles) {
    if (!validNewFiles.has(file)) {
      const p = path.join(brandsDir, file);
      try {
        fs.unlinkSync(p);
        console.log(`🗑️ Deleted unused brand file: ${file}`);
        deletedCount++;
      } catch (err) {
        console.error(`Failed to delete ${file}:`, err.message);
      }
    }
  }

  console.log('\n====================================');
  console.log(`🎉 Cleanup & Renaming Completed!`);
  console.log(`• Retained Active Brand Logos: ${validNewFiles.size}`);
  console.log(`• Deleted Unused Files: ${deletedCount}`);
  console.log('====================================\n');
}

cleanAndRenameBrandLogos()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
