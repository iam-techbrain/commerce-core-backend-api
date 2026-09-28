
// Database Seed Command {node seed.js]

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Database with Chhabra Sports Catalog...');

  // 1. Create Brands
  const brandsData = [
    { name: 'Alessi', description: 'Italian design house brand' },
    { name: 'Eva Solo', description: 'Danish designer home and cookware brand' },
    { name: 'Flos', description: 'Architectural and decorative lighting brand' },
    { name: 'Hay', description: 'Contemporary Danish furniture and accessories brand' },
    { name: 'Hercules', description: 'Premium bicycles and cycling gear' },
    { name: 'Joseph Joseph', description: 'Innovative houseware and kitchenware' },
    { name: 'KLÖBER', description: 'Ergonomic seating and office furniture solutions' },
    { name: 'Louis Poulsen', description: 'Iconic Danish lighting brand' },
    { name: 'Magisso', description: 'Nordic design and lifestyle products' },
    { name: 'Morrant', description: 'Cricket and sports equipment specialist' },
    { name: 'SG', description: 'Sanspareils Greenlands premium cricket manufacturing' },
    { name: 'SHREY', description: 'Cricket helmets, protective gear, and apparel' },
    { name: 'TYKA', description: 'Performance sportswear and athletic apparel' },
    { name: 'Versant', description: 'Outdoor, fitness and sports accessories' },
    { name: 'Vitra', description: 'Swiss design manufacturer of furniture' },
    { name: 'YONEX', description: 'Japanese sports equipment manufacturer' },
    { name: 'Yonex', description: 'Japanese sports equipment manufacturer' },
    { name: 'Head', description: 'Leading Austrian racquet and sports gear brand' },
    { name: 'Babolat', description: 'French tennis and badminton equipment company' },
    { name: 'SS', description: 'Sareen Sports legendary cricket equipment' },
    { name: 'Li-Ning', description: 'Global Olympic badminton and sportswear powerhouse' },
    { name: 'Asics', description: 'Specialized non-marking and court footwear' },
    { name: 'Adidas', description: 'Iconic football boots and athletic gear' },
    { name: 'Cosco', description: 'Indian fitness and sports equipment' },
    { name: 'Wilson', description: 'American premier tennis equipment' }
  ];

  const brands = {};
  for (const b of brandsData) {
    const brand = await prisma.brand.upsert({
      where: { name: b.name },
      update: {},
      create: b
    });
    brands[b.name] = brand.id;
  }

  // 1.5 Create Master Attributes & Values (Colors, Sizes, Weights, Heights, etc.)
  const masterAttributesData = [
    {
      name: 'Basket Ball Sizes',
      slug: 'basket-ball-sizes',
      values: ['5', '6', '7'].map(v => ({ value: v }))
    },
    {
      name: 'Brand',
      slug: 'brand',
      values: [
        'Adidas', 'Asics', 'CEAT', 'COSCO', 'Kookaburra', 'Moonwalker', 'MRF', 'Nike', 'NIVIA', 'Puma', 'SG', 'Shrey', 'SS', 'Stag', 'Yonex'
      ].map(v => ({ value: v }))
    },
    {
      name: 'Color',
      slug: 'color',
      values: [
        { value: 'Red', colorCode: '#EF4444' },
        { value: 'Blue', colorCode: '#3B82F6' },
        { value: 'Black', colorCode: '#0F172A' },
        { value: 'White', colorCode: '#F8FAFC' },
        { value: 'Green', colorCode: '#10B981' },
        { value: 'Navy Blue', colorCode: '#1E3A8A' },
        { value: 'Ruby / Black', colorCode: '#881337' },
        { value: 'Neon Yellow', colorCode: '#EAB308' },
        { value: 'Orange', colorCode: '#F97316' },
        { value: 'Grey', colorCode: '#64748B' },
        { value: 'Gold', colorCode: '#D97706' },
        ...[
          'Beige', 'BLACK/BLUE', 'BLACK/RED', 'BLACK/YELLOW', 'BLU/ORG', 'Brown', 'CAMO', 'CSK Yellow', 'CYAN', 'CYAN BLUE', 'FERRARI RED', 'India Blue', 'KKR Gold', 'KXIP Silver', 'MAGENTA', 'MI Blue', 'Navy', 'ORANGE', 'PEARLIZED BLUE DARK GREY', 'RCB Red', 'RED', 'RR Pink', 'SILVER GUNMETAL', 'WHT/MAROON', 'Grey / White', 'OFF white', 'Royal', 'Steel Blue', 'Yellow'
        ].map(v => ({ value: v }))
      ]
    },
    {
      name: 'Gym Ball',
      slug: 'gym-ball',
      values: ['55cm', '65cm', '75cm', '85cm', '95cm'].map(v => ({ value: v }))
    },
    {
      name: 'Hand Type',
      slug: 'hand-type',
      values: ['Left Handed Batsman', 'Right Handed Batsman'].map(v => ({ value: v }))
    },
    {
      name: 'Kitbag Size',
      slug: 'kitbag-size',
      values: ['Harrow', 'Junior', 'No.1', 'No.2', 'No.3', 'No.4', 'No.5', 'No.6', 'S. Junior', 'SH', 'XS. Junior', 'Youth'].map(v => ({ value: v }))
    },
    {
      name: 'KitBag Type',
      slug: 'kitbag-type',
      values: ['Duffle', 'Duffle Wheelie', 'Wheelie'].map(v => ({ value: v }))
    },
    {
      name: 'Level',
      slug: 'level',
      values: ['Ex-Heavy', 'Heavy', 'Light', 'Medium', 'Super-Heavy'].map(v => ({ value: v }))
    },
    {
      name: 'Material',
      slug: 'material',
      values: ['Filled', 'Unfilled', 'Rubber Moulded'].map(v => ({ value: v }))
    },
    {
      name: 'Size in cm',
      slug: 'size-in-cm',
      values: ['105cm', '120cm', '150cm', '180cm', '60cm', '90cm'].map(v => ({ value: v }))
    },
    {
      name: 'Size in UK',
      slug: 'size-in-uk',
      values: ['10', '11', '12', '4', '5', '6', '7', '8', '9', '13', '3', '3-10', 'Adult', 'Junior'].map(v => ({ value: v }))
    },
    {
      name: 'Size',
      slug: 'sizes',
      values: [
        '1', '2', '3', '3XL', '4', '5', '6', 'Adult', 'Extra Large', 'Extra Small Junior', 'Full Size', 'Junior', 'L', 'Large', 'M', 'Medium', 'S', 'Senior', 'SH', 'Small', 'Small Adult', 'Small Junior', 'XL', 'XS', 'XXL', 'Youth', '10', '11', '12', '13', '7', '8', '9', 'ADULT LH', 'ADULT RH', 'Boys', 'Mens', 'MENS LH', 'MENS RH', 'SMLH', 'SMRH', 'UK12', 'UK13', 'UK3-10', 'XXXL', 'YLH', 'YOUTH RH', 'YRH', 'UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11', 'Small (S)', 'Medium (M)', 'Large (L)', 'X-Large (XL)', 'XX-Large (XXL)'
      ].map(v => ({ value: v }))
    },
    {
      name: 'STRING',
      slug: 'string',
      values: [
        'AEROSONIC', 'BABOLAT RPM BLAST', 'BG 65 TITANIUM', 'BG 80', 'BG 80 POWER', 'EXBOLT 63', 'LINING NO.7', 'NANOGY 99', 'SOLICO BARB WIRE', 'SOLINCO CONFIDENTIAL', 'SOLINCO DRAGON EYE', 'SOLINCO HYPER-G', 'SOLINCO OUTLAST', 'STANDARD FACTORY STRUNG', 'UNSTRUNG', 'YONEX BG 65', 'YONEX BG 66 ULTIMAX', 'DOZEN'
      ].map(v => ({ value: v }))
    },
    {
      name: 'TENSION',
      slug: 'tension',
      values: ['22', '24', '25', '26', '28', '30', '32', '50', '52', '53', '55', '57', '59'].map(v => ({ value: v }))
    },
    {
      name: 'Weights',
      slug: 'weights',
      values: [
        '1 Kg', '1070g', '1125g', '1140g', '1145g', '1150g', '1160g', '1165', '1170g', '1175', '1175g', '1180g', '1185g', '1190', '1200', '15 Kg', '2 Kg', '20 Kg', '25 Kg', '3 Kg', '30 Kg', '35 kg', '4 Kg', '40 Kg', '5 Kg', 'Any', '10 Kg', '12.5 Kg', '2.5 Kg', '7.5 Kg', '2.5kg', '5kg', '7.5kg', '10kg', '12.5kg', '15kg', '20kg'
      ].map(v => ({ value: v }))
    },
    {
      name: 'Height / Length',
      slug: 'height-length',
      values: ['5ft', '6ft', '7ft', '10ft'].map(v => ({ value: v }))
    },
    {
      name: 'Thickness',
      slug: 'thickness',
      values: ['4mm', '6mm', '8mm', '10mm', '12mm'].map(v => ({ value: v }))
    },
    {
      name: 'Weight & Grip',
      slug: 'weight-grip',
      values: ['4U / G4', '4U / G5', '3U / G4', '3U / G5'].map(v => ({ value: v }))
    },
    {
      name: 'Cricket Bat Handle',
      slug: 'cricket-bat-handle',
      values: ['Short Handle (SH)', 'Long Handle (LH)'].map(v => ({ value: v }))
    }
  ];


  for (const attr of masterAttributesData) {
    const createdAttr = await prisma.attribute.upsert({
      where: { name: attr.name },
      update: { slug: attr.slug },
      create: { name: attr.name, slug: attr.slug }
    });

    for (const val of attr.values) {
      await prisma.attributeValue.upsert({
        where: {
          attributeId_value: {
            attributeId: createdAttr.id,
            value: val.value
          }
        },
        update: { colorCode: val.colorCode || null },
        create: {
          attributeId: createdAttr.id,
          value: val.value,
          colorCode: val.colorCode || null
        }
      });
    }
  }

  // 2. Create Categories & Subcategories
  const hierarchicalCategories = [
    {
      name: 'Cricket',
      description: 'Complete cricket equipment including bats, balls, gloves, leg guards and accessories',
      imageUrl: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&q=80&auto=format&fit=crop',
      subcategories: [
        { name: 'Cricket Bats', description: 'English Willow & Kashmir Willow bats' },
        { name: 'Cricket Balls', description: 'Leather match balls & practice balls' },
        { name: 'Batting Gloves', description: 'Protective batting gloves for adults & juniors' },
        { name: 'Leg Guards & Pads', description: 'Lightweight high-protection batting leg guards' },
        { name: 'Wicket Keeping Gloves', description: 'Pro wicketkeeping gloves and inner gloves' },
        { name: 'Cricket Helmets', description: 'High-impact protective cricket helmets' }
      ]
    },
    {
      name: 'Badminton',
      description: 'Professional badminton racquets, shuttlecocks, shoes and accessories',
      imageUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&q=80&auto=format&fit=crop',
      subcategories: [
        { name: 'Badminton Racquets', description: 'Head heavy, even balance & head light racquets' },
        { name: 'Feather Shuttlecocks', description: 'Tournament-grade goose feather shuttlecocks' },
        { name: 'Synthetic Shuttlecocks', description: 'Durable nylon shuttlecocks for practice' },
        { name: 'Badminton Shoes', description: 'Non-marking indoor court shoes with extra grip' },
        { name: 'Grips & Strings', description: 'Overgrips, replacement grips and high-tension strings' }
      ]
    },
    {
      name: 'Tennis',
      description: 'Tour-level tennis racquets, balls, strings and gear',
      imageUrl: 'https://images.unsplash.com/photo-1595435742656-5272d0b3fa82?w=600&q=80&auto=format&fit=crop',
      subcategories: [
        { name: 'Tennis Racquets', description: 'Control, power and spin tennis racquets' },
        { name: 'Tennis Balls', description: 'Championship match tennis balls' },
        { name: 'Tennis Grips & Strings', description: 'Pro string reels and vibration dampeners' }
      ]
    },
    {
      name: 'Football',
      description: 'Football boots, match balls and protective shin guards',
      imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&q=80&auto=format&fit=crop',
      subcategories: [
        { name: 'Football Boots & Cleats', description: 'Firm ground, turf and indoor football boots' },
        { name: 'Footballs & Shin Guards', description: 'Match footballs and ergonomic shin pads' }
      ]
    },
    {
      name: 'Gym & Fitness',
      description: 'Dumbbells, resistance bands, yoga mats and strength training gear',
      imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80&auto=format&fit=crop',
      subcategories: [
        { name: 'Dumbbells & Weights', description: 'Rubber coated dumbell sets & kettlebells' },
        { name: 'Fitness Accessories & Mats', description: 'Yoga mats, resistance bands and gym accessories' }
      ]
    }
  ];

  const categories = {};
  const subcategories = {};

  for (const group of hierarchicalCategories) {
    // Category (Main Table)
    const cat = await prisma.category.upsert({
      where: { name: group.name },
      update: { description: group.description, imageUrl: group.imageUrl },
      create: { name: group.name, description: group.description, imageUrl: group.imageUrl }
    });
    categories[group.name] = cat.id;

    // SubCategory (Separate Table)
    if (group.subcategories) {
      for (const sub of group.subcategories) {
        const subCat = await prisma.subCategory.upsert({
          where: { name: sub.name },
          update: { description: sub.description, categoryId: cat.id, imageUrl: group.imageUrl },
          create: { name: sub.name, description: sub.description, categoryId: cat.id, imageUrl: group.imageUrl }
        });
        subcategories[sub.name] = { id: subCat.id, categoryId: cat.id };
      }
    }
  }

  // 3. Create Products
  const productsData = [
    {
      name: 'Yonex Astrox 88D Pro Badminton Racquet',
      sku: 'YNX-AX88DP',
      description: 'Head Heavy · Stiff Shaft · Pre-String Option. The ultimate choice for dominating backcourt smashers.',
      mrp: 17999,
      price: 14999,
      stock: 25,
      imageUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&q=80&auto=format&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&q=80&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1595435742656-5272d0b3fa82?w=600&q=80&auto=format&fit=crop'
      ]),
      hasVariants: true,
      variants: [
        { sku: 'YNX-88DP-4U5', title: '4U / G5 · Black/Ruby', attributes: JSON.stringify({ 'Weight & Grip': '4U / G5', Color: 'Black/Ruby' }), mrp: 17999, price: 14999, stock: 15 },
        { sku: 'YNX-88DP-3U4', title: '3U / G4 · Black/Ruby', attributes: JSON.stringify({ 'Weight & Grip': '3U / G4', Color: 'Black/Ruby' }), mrp: 17999, price: 15499, stock: 10 }
      ],
      categoryName: 'Badminton Racquets',
      brandName: 'Yonex'
    },
    {
      name: 'Head Speed MP 2024 Tennis Racquet',
      sku: 'HD-SPD-MP24',
      description: '300g · 100 sq.in · Auxetic 2.0 Tech · Unstrung Frame. Superb control with explosive swing speed.',
      mrp: 22999,
      price: 18999,
      stock: 18,
      imageUrl: 'https://images.unsplash.com/photo-1595435742656-5272d0b3fa82?w=600&q=80&auto=format&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1595435742656-5272d0b3fa82?w=600&q=80&auto=format&fit=crop'
      ]),
      categoryName: 'Tennis Racquets',
      brandName: 'Head'
    },
    {
      name: 'SS Ton Reserve Edition English Willow Bat',
      sku: 'SS-TON-RES',
      description: 'Grade 1 Willow · Weight 1180g · Hand Oiled & Knocked. Massive edges and feather-light pickup.',
      mrp: 15999,
      price: 12499,
      stock: 15,
      imageUrl: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&q=80&auto=format&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&q=80&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1531973576160-7125cd663d86?w=600&q=80&auto=format&fit=crop'
      ]),
      hasVariants: true,
      variants: [
        { sku: 'SS-TON-1180-SH', title: '1180g · Short Handle', attributes: JSON.stringify({ Weight: '1180g', Handle: 'Short Handle' }), mrp: 15999, price: 12499, stock: 8 },
        { sku: 'SS-TON-1220-SH', title: '1220g · Short Handle', attributes: JSON.stringify({ Weight: '1220g', Handle: 'Short Handle' }), mrp: 15999, price: 12499, stock: 7 }
      ],
      categoryName: 'Cricket Bats',
      brandName: 'SS'
    },
    {
      name: 'Li-Ning Halbertec 7000 Badminton Racquet',
      sku: 'LN-HALB-7000',
      description: '3U / G5 · Even Balance · High Elasticity Carbon Shaft. Exceptional precision and frame recovery.',
      mrp: 16499,
      price: 13599,
      stock: 20,
      imageUrl: 'https://images.unsplash.com/photo-1595435742656-5272d0b3fa82?w=600&q=80&auto=format&fit=crop',
      categoryName: 'Badminton Racquets',
      brandName: 'Li-Ning'
    },
    {
      name: 'Asics Gel-Rocket 11 Non-Marking Indoor Shoes',
      sku: 'ASC-GEL-R11',
      description: 'Gel Cushioning · Trusstic Tech · Non-Marking Gum Sole. Superior grip on badminton & squash courts.',
      mrp: 6999,
      price: 5499,
      stock: 35,
      imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80&auto=format&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80&auto=format&fit=crop'
      ]),
      hasVariants: true,
      variants: [
        { sku: 'ASC-R11-UK8', title: 'UK 8 · White/Deep Blue', attributes: JSON.stringify({ Size: 'UK 8', Color: 'White/Deep Blue' }), mrp: 6999, price: 5499, stock: 15 },
        { sku: 'ASC-R11-UK9', title: 'UK 9 · White/Deep Blue', attributes: JSON.stringify({ Size: 'UK 9', Color: 'White/Deep Blue' }), mrp: 6999, price: 5499, stock: 12 },
        { sku: 'ASC-R11-UK10', title: 'UK 10 · White/Deep Blue', attributes: JSON.stringify({ Size: 'UK 10', Color: 'White/Deep Blue' }), mrp: 6999, price: 5499, stock: 8 }
      ],
      categoryName: 'Badminton Shoes',
      brandName: 'Asics'
    },
    {
      name: 'Babolat Pure Drive 2024 Tennis Racquet',
      sku: 'BAB-PD-2024',
      description: '300g · FSI Power Tech · High Power & Explosive Feel. Iconic blue racquet for big baseliners.',
      mrp: 23999,
      price: 19499,
      stock: 12,
      imageUrl: 'https://images.unsplash.com/photo-1595435742656-5272d0b3fa82?w=600&q=80&auto=format&fit=crop',
      categoryName: 'Tennis Racquets',
      brandName: 'Babolat'
    },
    {
      name: 'Adidas Predator Elite FG Football Boots',
      sku: 'ADI-PRED-ELITE',
      description: 'Controlframe 2.0 · Moulded Studs · HybridTouch Upper. Strike with pinpoint swerve and control.',
      mrp: 11999,
      price: 8999,
      stock: 16,
      imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&q=80&auto=format&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&q=80&auto=format&fit=crop'
      ]),
      hasVariants: true,
      variants: [
        { sku: 'ADI-PRED-UK8', title: 'UK 8 · Core Black', attributes: JSON.stringify({ Size: 'UK 8', Color: 'Core Black' }), mrp: 11999, price: 8999, stock: 8 },
        { sku: 'ADI-PRED-UK9', title: 'UK 9 · Core Black', attributes: JSON.stringify({ Size: 'UK 9', Color: 'Core Black' }), mrp: 11999, price: 8999, stock: 8 }
      ],
      categoryName: 'Football Boots & Cleats',
      brandName: 'Adidas'
    },
    {
      name: 'Yonex Tourney No.1 Feather Shuttlecocks (12 Pack)',
      sku: 'YNX-SHUT-T1',
      description: 'Grade A Goose Feather · Speed 77 · Tournament Class flight consistency and durability.',
      mrp: 1899,
      price: 1499,
      stock: 80,
      imageUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&q=80&auto=format&fit=crop',
      categoryName: 'Feather Shuttlecocks',
      brandName: 'Yonex'
    },
    {
      name: 'SG Test Players Wicket Keeping Gloves',
      sku: 'SG-WK-TEST',
      description: 'Premium Leather · Rubberized Palm Grip · Brass Thimbles for professional wicketkeeping protection.',
      mrp: 4199,
      price: 3299,
      stock: 22,
      imageUrl: 'https://images.unsplash.com/photo-1531973576160-7125cd663d86?w=600&q=80&auto=format&fit=crop',
      categoryName: 'Wicket Keeping Gloves',
      brandName: 'SG'
    },
    {
      name: 'Cosco Adjustable Rubber Dumbbell Set 20kg Kit',
      sku: 'COS-DUMB-20KG',
      description: 'Heavy Duty Rubber Coated Plates for high durability home gym workout.',
      mrp: 5999,
      price: 4499,
      stock: 28,
      imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80&auto=format&fit=crop',
      hasVariants: true,
      variants: [
        { sku: 'COS-DUMB-10KG', title: '10kg Pair', attributes: JSON.stringify({ Weight: '10kg' }), mrp: 3999, price: 2999, stock: 15 },
        { sku: 'COS-DUMB-20KG-SET', title: '20kg Pair', attributes: JSON.stringify({ Weight: '20kg' }), mrp: 5999, price: 4499, stock: 13 }
      ],
      categoryName: 'Dumbbells & Weights',
      brandName: 'Cosco'
    },
    {
      name: 'Yonex Nanoflare 1000Z Speed Racquet',
      sku: 'YNX-NF-1000Z',
      description: '4U / G5 · Head Light · Ultra High Modulus Graphite. Smash speed world-record holding racquet.',
      mrp: 19999,
      price: 16999,
      stock: 14,
      imageUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&q=80&auto=format&fit=crop',
      categoryName: 'Badminton Racquets',
      brandName: 'Yonex'
    },
    {
      name: 'Wilson Pro Staff 97 v14 Tennis Racquet',
      sku: 'WIL-PS-97V14',
      description: '315g · 97 sq.in · Paradigm Bending Tech · Precision classical feel inspired by Roger Federer.',
      mrp: 26999,
      price: 21999,
      stock: 10,
      imageUrl: 'https://images.unsplash.com/photo-1595435742656-5272d0b3fa82?w=600&q=80&auto=format&fit=crop',
      categoryName: 'Tennis Racquets',
      brandName: 'Wilson'
    }
  ];

  for (const p of productsData) {
    const subInfo = subcategories[p.categoryName];
    let categoryId;
    let subCategoryId = null;

    if (subInfo) {
      subCategoryId = subInfo.id;
      categoryId = subInfo.categoryId;
    } else {
      categoryId = categories[p.categoryName] || Object.values(categories)[0];
    }

    const brandId = brands[p.brandName];

    const prod = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        description: p.description,
        mrp: p.mrp || null,
        price: p.price,
        stock: p.stock,
        imageUrl: p.imageUrl,
        images: p.images || null,
        hasVariants: p.hasVariants || false,
        categoryId,
        subCategoryId,
        brandId,
        brandName: p.brandName
      },
      create: {
        name: p.name,
        sku: p.sku,
        description: p.description,
        mrp: p.mrp || null,
        price: p.price,
        stock: p.stock,
        imageUrl: p.imageUrl,
        images: p.images || null,
        hasVariants: p.hasVariants || false,
        categoryId,
        subCategoryId,
        brandId,
        brandName: p.brandName
      }
    });

    if (p.variants && p.variants.length > 0) {
      for (const v of p.variants) {
        await prisma.productVariant.upsert({
          where: { sku: v.sku },
          update: {
            title: v.title,
            attributes: v.attributes || null,
            mrp: v.mrp,
            price: v.price,
            stock: v.stock,
            imageUrl: v.imageUrl || null
          },
          create: {
            productId: prod.id,
            sku: v.sku,
            title: v.title,
            attributes: v.attributes || null,
            mrp: v.mrp,
            price: v.price,
            stock: v.stock,
            imageUrl: v.imageUrl || null
          }
        });
      }
    }
  }

  // 4. Create Users (Admin & Customer)
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('123456', salt);

  // Delete user@gmail.com if exists
  await prisma.user.deleteMany({
    where: { email: 'user@gmail.com' }
  });

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
    { username: 'Alia Khan', email: 'alia@gmail.com', phone: '1234567890' },
    { username: 'Rohan Verma', email: 'rohan@gmail.com', phone: '1234567890' },
    { username: 'Amir Khan', email: 'amir@gmail.com', phone: '1234567890' },
    { username: 'Ritik Sharma', email: 'ritik@gmail.com', phone: '1234567890' },
    { username: 'Salman Khan', email: 'salman@gmail.com', phone: '1234567890' },
    { username: 'Ananya Gupta', email: 'ananya@gmail.com', phone: '1234567890' },
    { username: 'Shah Rukh Khan', email: 'shahrukh@gmail.com', phone: '1234567890' },
    { username: 'Deepika Padukone', email: 'deepika@gmail.com', phone: '1234567890' }
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


  // 5. Add Address for Admin
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

  // 6. Create a Demo Past Order for Admin to view in Profile
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

  console.log('✅ Database successfully seeded with categories, products, and users!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
