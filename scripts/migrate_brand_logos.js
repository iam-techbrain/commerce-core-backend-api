const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
const brandsDir = path.join(uploadsDir, 'brands');

async function migrateBrandLogos() {
  console.log('🚀 Migrating Brand logos to /public/uploads/brands/ ...');

  if (!fs.existsSync(brandsDir)) {
    fs.mkdirSync(brandsDir, { recursive: true });
  }

  const brands = await prisma.brand.findMany();
  let updatedCount = 0;

  for (const b of brands) {
    if (!b.logoUrl) continue;

    // Check if it's currently pointing directly to /uploads/logo-...
    if (b.logoUrl.startsWith('/uploads/') && !b.logoUrl.startsWith('/uploads/brands/')) {
      const fileName = path.basename(b.logoUrl);
      const currentFilePath = path.join(uploadsDir, fileName);
      const targetFilePath = path.join(brandsDir, fileName);

      // If file exists at root of uploads, move it into brands folder
      if (fs.existsSync(currentFilePath)) {
        fs.renameSync(currentFilePath, targetFilePath);
        console.log(`📁 Moved file: ${fileName} -> /uploads/brands/${fileName}`);
      } else if (fs.existsSync(targetFilePath)) {
        console.log(`ℹ️ File already exists in brands: ${fileName}`);
      } else {
        console.warn(`⚠️ Warning: Physical file not found at ${currentFilePath}`);
      }

      // Update database record to point to /uploads/brands/...
      const newLogoUrl = `/uploads/brands/${fileName}`;
      await prisma.brand.update({
        where: { id: b.id },
        data: { logoUrl: newLogoUrl }
      });

      console.log(`✅ [DB Updated] Brand "${b.name}" (ID: ${b.id}): ${b.logoUrl} -> ${newLogoUrl}`);
      updatedCount++;
    }
  }

  console.log('\n====================================');
  console.log(`🎉 Brand Logos Migration Finished!`);
  console.log(`• Total Brands Updated: ${updatedCount}`);
  console.log('====================================\n');
}

migrateBrandLogos()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
