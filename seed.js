// Database Seed Command [node seed.js]

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Chhabra Sports Real Catalog Import & Database Seeding...');

  // 0. Ensure public/uploads/products directory exists and copy images
  const sourceImagesDir = path.resolve(__dirname, '../Chhabra-Sports-Product-Images');
  const targetUploadsDir = path.resolve(__dirname, 'public/uploads/products');

  if (!fs.existsSync(targetUploadsDir)) {
    fs.mkdirSync(targetUploadsDir, { recursive: true });
  }

  let sourceImageFiles = [];
  if (fs.existsSync(sourceImagesDir)) {
    sourceImageFiles = fs.readdirSync(sourceImagesDir);
    console.log(`📁 Copying ${sourceImageFiles.length} product images to public/uploads/products/ ...`);

    for (const file of sourceImageFiles) {
      const srcPath = path.join(sourceImagesDir, file);
      const destPath = path.join(targetUploadsDir, file);
      fs.copyFileSync(srcPath, destPath);
    }
    console.log('✅ All product images successfully copied to public/uploads/products/!');
  } else {
    console.warn(`⚠️ Warning: Source images folder not found at ${sourceImagesDir}`);
  }

  // 1. Create Brands
  const defaultBrands = [
    { name: 'Adidas', description: 'Global athletic footwear and apparel powerhouse' },
    { name: 'Airavat', description: 'Premium fitness gear, protective equipment and sports accessories' },
    { name: 'Yonex', description: 'World leader in badminton and tennis gear' },
    { name: 'Li-Ning', description: 'Olympic badminton equipment and athletic sportswear' },
    { name: 'Head', description: 'Tour-level racquets and tennis equipment' },
    { name: 'Babolat', description: 'French tennis and badminton specialist' },
    { name: 'Wilson', description: 'American premier tennis equipment' },
    { name: 'SS', description: 'Sareen Sports legendary cricket equipment' },
    { name: 'SG', description: 'Sanspareils Greenlands premium cricket manufacturing' },
    { name: 'Cosco', description: 'Indian fitness and sports gear' },
    { name: 'Asics', description: 'Non-marking court footwear specialist' },
    { name: 'Chhabra Sports', description: 'Official Chhabra Sports signature gear' }
  ];

  const brands = {};
  for (const b of defaultBrands) {
    const brand = await prisma.brand.upsert({
      where: { name: b.name },
      update: { description: b.description },
      create: b
    });
    brands[b.name.toLowerCase()] = brand.id;
    brands[b.name] = brand.id;
  }

  // 2. Read Excel Sheet
  const excelFilePath = path.resolve(__dirname, '../Chhabra-Sports-Product-Lists.xlsx');
  if (!fs.existsSync(excelFilePath)) {
    throw new Error(`Excel file not found at ${excelFilePath}`);
  }

  const workbook = XLSX.readFile(excelFilePath);
  const excelRows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
  console.log(`📊 Loaded ${excelRows.length} products from Chhabra-Sports-Product-Lists.xlsx`);

  // 3. Create Categories & SubCategories dynamically from Excel Data
  const categoriesMap = {};
  const subCategoriesMap = {};

  for (const row of excelRows) {
    const rawCat = row.Categories ? String(row.Categories).trim() : 'General Sports';
    const rawSub = row['Sub-Categories'] ? String(row['Sub-Categories']).trim() : 'Equipment';

    // Main Category
    if (!categoriesMap[rawCat]) {
      const cat = await prisma.category.upsert({
        where: { name: rawCat },
        update: {},
        create: {
          name: rawCat,
          description: `${rawCat} sports equipment, footwear and accessories`
        }
      });
      categoriesMap[rawCat] = cat.id;
    }

    // SubCategory
    const subKey = `${rawCat}_${rawSub}`;
    if (!subCategoriesMap[subKey]) {
      const subCat = await prisma.subCategory.upsert({
        where: { name: rawSub },
        update: { categoryId: categoriesMap[rawCat] },
        create: {
          name: rawSub,
          description: `${rawSub} in ${rawCat}`,
          categoryId: categoriesMap[rawCat]
        }
      });
      subCategoriesMap[subKey] = subCat.id;
      subCategoriesMap[rawSub] = subCat.id;
    }
  }

  console.log('✅ Created/Synced Main Categories & Subcategories from Excel');

  // 4. Helper function to find images by S.No
  const getImagesForSNo = (sno) => {
    const snoStr = String(sno).trim();
    if (!sourceImageFiles || sourceImageFiles.length === 0) return { cover: null, gallery: null };

    // Match files starting with S.No followed by a dot e.g. "1.1.jpg", "1.2.jpg"
    const matchedFiles = sourceImageFiles.filter((file) => {
      const parts = file.split('.');
      return parts[0] === snoStr;
    });

    // Sort numerically by the second index (e.g. 1.1, 1.2, 1.3)
    matchedFiles.sort((a, b) => {
      const aSub = parseFloat(a.split('.').slice(0, 2).join('.'));
      const bSub = parseFloat(b.split('.').slice(0, 2).join('.'));
      return (aSub || 0) - (bSub || 0);
    });

    if (matchedFiles.length === 0) return { cover: null, gallery: null };

    const cover = `/uploads/products/${matchedFiles[0]}`;
    const gallery = JSON.stringify(matchedFiles.map((f) => `/uploads/products/${f}`));

    return { cover, gallery };
  };

  // 5. Seed Products & Variants from Excel Rows
  let seededProductsCount = 0;

  for (const row of excelRows) {
    const sno = row['S.No'];
    const sku = row.SKU ? String(row.SKU).trim() : `CS-SKU-${sno}`;
    const name = row.Name ? String(row.Name).trim() : `Chhabra Sports Item #${sno}`;
    const salePrice = parseFloat(row['Sale Price']) || parseFloat(row.Price) || 999;
    const mrp = parseFloat(row.Price) || (salePrice ? salePrice * 1.2 : 1299);

    const rawCat = row.Categories ? String(row.Categories).trim() : 'General Sports';
    const rawSub = row['Sub-Categories'] ? String(row['Sub-Categories']).trim() : 'Equipment';

    const categoryId = categoriesMap[rawCat];
    const subCategoryId = subCategoriesMap[`${rawCat}_${rawSub}`] || subCategoriesMap[rawSub];

    // Images matching S.No
    const { cover, gallery } = getImagesForSNo(sno);

    // Detect Brand from Name
    let detectedBrandName = 'Chhabra Sports';
    let detectedBrandId = brands['Chhabra Sports'];
    const nameLower = name.toLowerCase();

    for (const bName of Object.keys(brands)) {
      if (nameLower.includes(bName.toLowerCase())) {
        detectedBrandName = bName;
        detectedBrandId = brands[bName];
        break;
      }
    }

    // Handle Variants (Size, Color, Weights, Hand Type, Level)
    const sizeStr = row.Size ? String(row.Size).trim() : '';
    const colorStr = row.Color ? String(row.Color).trim() : '';
    const weightStr = row.Weights ? String(row.Weights).trim() : '';
    const sizes = sizeStr && sizeStr.toUpperCase() !== 'N/A' ? sizeStr.split(',').map((s) => s.trim()).filter(Boolean) : [];

    const hasVariants = sizes.length > 0;

    const prod = await prisma.product.upsert({
      where: { sku },
      update: {
        name,
        description: `${name} - High quality ${rawSub} for ${rawCat}. Official Chhabra Sports genuine product.`,
        mrp,
        price: salePrice,
        stock: 25,
        imageUrl: cover,
        images: gallery,
        hasVariants,
        categoryId,
        subCategoryId,
        brandId: detectedBrandId,
        brandName: detectedBrandName
      },
      create: {
        name,
        sku,
        description: `${name} - High quality ${rawSub} for ${rawCat}. Official Chhabra Sports genuine product.`,
        mrp,
        price: salePrice,
        stock: 25,
        imageUrl: cover,
        images: gallery,
        hasVariants,
        categoryId,
        subCategoryId,
        brandId: detectedBrandId,
        brandName: detectedBrandName
      }
    });

    // Create Variants if Sizes exist
    if (sizes.length > 0) {
      for (const sz of sizes) {
        const variantSku = `${sku}-SZ-${sz.replace(/\s+/g, '')}`;
        await prisma.productVariant.upsert({
          where: { sku: variantSku },
          update: {
            title: `Size: ${sz}`,
            attributes: JSON.stringify({ Size: sz, ...(colorStr && { Color: colorStr }), ...(weightStr && { Weight: weightStr }) }),
            mrp,
            price: salePrice,
            stock: 10,
            imageUrl: cover
          },
          create: {
            productId: prod.id,
            sku: variantSku,
            title: `Size: ${sz}`,
            attributes: JSON.stringify({ Size: sz, ...(colorStr && { Color: colorStr }), ...(weightStr && { Weight: weightStr }) }),
            mrp,
            price: salePrice,
            stock: 10,
            imageUrl: cover
          }
        });
      }
    }

    seededProductsCount++;
  }

  console.log(`✅ Successfully seeded ${seededProductsCount} Products with local image mapping!`);

  // 6. Create Users (Admin & Customer)
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('123456', salt);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: { phone: '1234567890' },
    create: {
      username: 'Admin User',
      email: 'admin@gmail.com',
      password: passwordHash,
      phone: '1234567890',
      role: 'ADMIN'
    }
  });

  const customerUsers = [
    { username: 'Ajay Yadav', email: 'ajay@gmail.com', phone: '1234567890' },
    { username: 'Katrina Kaif', email: 'katrina@gmail.com', phone: '1234567890' },
    { username: 'Rohan Verma', email: 'rohan@gmail.com', phone: '1234567890' },
    { username: 'Ananya Gupta', email: 'ananya@gmail.com', phone: '1234567890' }
  ];

  for (const user of customerUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        username: user.username,
        email: user.email,
        password: passwordHash,
        phone: user.phone,
        role: 'CUSTOMER'
      }
    });
  }

  // 7. Add Address for Admin
  const address = await prisma.address.create({
    data: {
      userId: adminUser.id,
      fullName: 'Ajay Yadav',
      phone: '1234567890',
      addressLine1: 'Bihar complex, Main Road, Kankarbagh',
      city: 'Patna',
      state: 'Bihar',
      pincode: '800020',
      country: 'India',
      isDefault: true
    }
  });

  // 8. Create a Demo Past Order for Admin
  const prod = await prisma.product.findFirst();
  if (prod) {
    const orderNumber = `ORD-${Date.now()}`;
    await prisma.order.create({
      data: {
        orderNumber,
        userId: adminUser.id,
        addressId: address.id,
        totalAmount: prod.price,
        discountAmount: 0,
        shippingFee: 0,
        finalAmount: prod.price,
        paymentStatus: 'PAID',
        orderStatus: 'DELIVERED',
        razorpayOrderId: `order_${Date.now()}`,
        razorpayPaymentId: `pay_${Date.now()}`,
        razorpaySignature: 'sample_sig',
        items: {
          create: [
            {
              productId: prod.id,
              quantity: 1,
              unitPrice: prod.price,
              totalPrice: prod.price
            }
          ]
        }
      }
    });
  }

  console.log('🎉 Database seeding and local image linking completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
