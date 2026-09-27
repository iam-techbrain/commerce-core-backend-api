const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Database with Chhabra Sports Catalog...');

  // 1. Create Brands
  const brandsData = [
    { name: 'Yonex', description: 'Japanese sports equipment manufacturer' },
    { name: 'Head', description: 'Leading Austrian racquet and sports gear brand' },
    { name: 'Babolat', description: 'French tennis and badminton equipment company' },
    { name: 'SS', description: 'Sareen Sports legendary cricket equipment' },
    { name: 'SG', description: 'Sanspareils Greenlands premium cricket manufacturing' },
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
        { value: 'Gold', colorCode: '#D97706' }
      ]
    },
    {
      name: 'Size',
      slug: 'size',
      values: [
        { value: 'UK 6' },
        { value: 'UK 7' },
        { value: 'UK 8' },
        { value: 'UK 9' },
        { value: 'UK 10' },
        { value: 'UK 11' },
        { value: 'Small (S)' },
        { value: 'Medium (M)' },
        { value: 'Large (L)' },
        { value: 'X-Large (XL)' },
        { value: 'XX-Large (XXL)' }
      ]
    },
    {
      name: 'Weight',
      slug: 'weight',
      values: [
        { value: '2.5kg' },
        { value: '5kg' },
        { value: '7.5kg' },
        { value: '10kg' },
        { value: '12.5kg' },
        { value: '15kg' },
        { value: '20kg' },
        { value: '1180g' },
        { value: '1200g' },
        { value: '1220g' }
      ]
    },
    {
      name: 'Height / Length',
      slug: 'height-length',
      values: [
        { value: '5ft' },
        { value: '6ft' },
        { value: '7ft' },
        { value: '10ft' }
      ]
    },
    {
      name: 'Thickness',
      slug: 'thickness',
      values: [
        { value: '4mm' },
        { value: '6mm' },
        { value: '8mm' },
        { value: '10mm' },
        { value: '12mm' }
      ]
    },
    {
      name: 'Weight & Grip',
      slug: 'weight-grip',
      values: [
        { value: '4U / G4' },
        { value: '4U / G5' },
        { value: '3U / G4' },
        { value: '3U / G5' }
      ]
    },
    {
      name: 'Cricket Bat Handle',
      slug: 'cricket-bat-handle',
      values: [
        { value: 'Short Handle (SH)' },
        { value: 'Long Handle (LH)' }
      ]
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

  // 2. Create Categories
  const categoriesData = [
    {
      name: 'Badminton & Racquets',
      description: 'Professional racquets, shuttlecocks, kitbags and court accessories',
      imageUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&q=80&auto=format&fit=crop'
    },
    {
      name: 'Tennis Racquets & Gear',
      description: 'Tour-level tennis racquets, balls, strings, and grips',
      imageUrl: 'https://images.unsplash.com/photo-1595435742656-5272d0b3fa82?w=600&q=80&auto=format&fit=crop'
    },
    {
      name: 'Cricket Bats & Gear',
      description: 'Grade 1 English Willow & Kashmir Willow bats, protective equipment',
      imageUrl: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&q=80&auto=format&fit=crop'
    },
    {
      name: 'Non-Marking Court Shoes',
      description: 'Badminton, tennis, volleyball indoor court footwear with grip technology',
      imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80&auto=format&fit=crop'
    },
    {
      name: 'Football & Boots',
      description: 'Firm ground, turf cleats, match-grade footballs and shin pads',
      imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&q=80&auto=format&fit=crop'
    },
    {
      name: 'Gym & Fitness Gear',
      description: 'Dumbbells, resistance bands, yoga mats and strength accessories',
      imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80&auto=format&fit=crop'
    },
    {
      name: 'Strings & Accessories',
      description: 'Pro string reels, vibration dampeners, replacement grips & towels',
      imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&q=80&auto=format&fit=crop'
    }
  ];

  const categories = {};
  for (const c of categoriesData) {
    const cat = await prisma.category.upsert({
      where: { name: c.name },
      update: { imageUrl: c.imageUrl, description: c.description },
      create: c
    });
    categories[c.name] = cat.id;
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
      categoryName: 'Badminton & Racquets',
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
      categoryName: 'Tennis Racquets & Gear',
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
      categoryName: 'Cricket Bats & Gear',
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
      categoryName: 'Badminton & Racquets',
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
      categoryName: 'Non-Marking Court Shoes',
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
      categoryName: 'Tennis Racquets & Gear',
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
      categoryName: 'Football & Boots',
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
      categoryName: 'Badminton & Racquets',
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
      categoryName: 'Cricket Bats & Gear',
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
      categoryName: 'Gym & Fitness Gear',
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
      categoryName: 'Badminton & Racquets',
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
      categoryName: 'Tennis Racquets & Gear',
      brandName: 'Wilson'
    }
  ];

  for (const p of productsData) {
    const categoryId = categories[p.categoryName];
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
  const passwordHash = await bcrypt.hash('password123', salt);

  const adminUser = await prisma.user.upsert({
    where: { email: 'afzal@schooldigitalised.com' },
    update: {},
    create: {
      username: 'Afzal Alam',
      email: 'afzal@schooldigitalised.com',
      password: passwordHash,
      phone: '7277252440',
      role: 'ADMIN'
    }
  });

  const demoCustomer = await prisma.user.upsert({
    where: { email: 'rahul@gmail.com' },
    update: {},
    create: {
      username: 'Rahul Sharma',
      email: 'rahul@gmail.com',
      password: passwordHash,
      phone: '9876543210',
      role: 'CUSTOMER'
    }
  });

  // 5. Add Address for Admin
  const address = await prisma.address.create({
    data: {
      userId: adminUser.id,
      fullName: 'Afzal Alam',
      phone: '7277252440',
      addressLine1: 'Chhabra Sports Complex, Main Road, Kankarbagh',
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
