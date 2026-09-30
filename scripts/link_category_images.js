const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const categoriesDir = path.join(__dirname, '..', 'public', 'uploads', 'categories');

// Map of category name to the file you created in public/uploads/categories/
const categoryFileMapping = {
  'cricket': 'cricket.avif',
  'fitness': 'fitness.avif',
  'badminton': 'badminton.avif',
  'pickleball': 'pickleball.avif',
  'lawn tennis': 'lawn_tennis.avif',
  'clothing': 'clothing.avif',
  'general sports': 'general_sports.avif'
};

async function linkCategoryImages() {
  console.log('🚀 Linking existing Category images to database...');

  if (!fs.existsSync(categoriesDir)) {
    console.error('Directory does not exist:', categoriesDir);
    return;
  }

  const existingFiles = fs.readdirSync(categoriesDir);
  console.log('Available files in categories dir:', existingFiles);

  const categories = await prisma.category.findMany();
  let updatedCount = 0;

  for (const cat of categories) {
    const cleanKey = cat.name.trim().toLowerCase();
    const matchedFile = categoryFileMapping[cleanKey];

    if (matchedFile && existingFiles.includes(matchedFile)) {
      const localPath = `/uploads/categories/${matchedFile}`;

      await prisma.category.update({
        where: { id: cat.id },
        data: {
          imageUrl: localPath
        }
      });

      console.log(`✅ [Category Updated] "${cat.name}" (ID: ${cat.id}): -> ${localPath}`);
      updatedCount++;
    } else {
      console.warn(`⚠️ No matching file found for category "${cat.name}"`);
    }
  }

  console.log('\n====================================');
  console.log(`🎉 Category Images Linked!`);
  console.log(`• Updated Categories: ${updatedCount}/${categories.length}`);
  console.log('====================================\n');
}

linkCategoryImages()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
