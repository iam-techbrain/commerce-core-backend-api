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
      description: '4U / G5 · Head Heavy · Stiff Shaft · Pre-String Option. The ultimate choice for dominating backcourt smashers.',
      price: 14999,
      stock: 25,
      imageUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&q=80&auto=format&fit=crop',
      categoryName: 'Badminton & Racquets',
      brandName: 'Yonex'
    },
    {
      name: 'Head Speed MP 2024 Tennis Racquet',
      sku: 'HD-SPD-MP24',
      description: '300g · 100 sq.in · Auxetic 2.0 Tech · Unstrung Frame. Superb control with explosive swing speed.',
      price: 18999,
      stock: 18,
      imageUrl: 'https://images.unsplash.com/photo-1595435742656-5272d0b3fa82?w=600&q=80&auto=format&fit=crop',
      categoryName: 'Tennis Racquets & Gear',
      brandName: 'Head'
    },
    {
      name: 'SS Ton Reserve Edition English Willow Bat',
      sku: 'SS-TON-RES',
      description: 'Grade 1 Willow · Weight 1180g · Hand Oiled & Knocked. Massive edges and feather-light pickup.',
      price: 12499,
      stock: 15,
      imageUrl: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&q=80&auto=format&fit=crop',
      categoryName: 'Cricket Bats & Gear',
      brandName: 'SS'
    },
    {
      name: 'Li-Ning Halbertec 7000 Badminton Racquet',
      sku: 'LN-HALB-7000',
      description: '3U / G5 · Even Balance · High Elasticity Carbon Shaft. Exceptional precision and frame recovery.',
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
      price: 5499,
      stock: 35,
      imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80&auto=format&fit=crop',
      categoryName: 'Non-Marking Court Shoes',
      brandName: 'Asics'
    },
    {
      name: 'Babolat Pure Drive 2024 Tennis Racquet',
      sku: 'BAB-PD-2024',
      description: '300g · FSI Power Tech · High Power & Explosive Feel. Iconic blue racquet for big baseliners.',
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
      price: 8999,
      stock: 16,
      imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&q=80&auto=format&fit=crop',
      categoryName: 'Football & Boots',
      brandName: 'Adidas'
    },
    {
      name: 'Yonex Tourney No.1 Feather Shuttlecocks (12 Pack)',
      sku: 'YNX-SHUT-T1',
      description: 'Grade A Goose Feather · Speed 77 · Tournament Class flight consistency and durability.',
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
      price: 3299,
      stock: 22,
      imageUrl: 'https://images.unsplash.com/photo-1531973576160-7125cd663d86?w=600&q=80&auto=format&fit=crop',
      categoryName: 'Cricket Bats & Gear',
      brandName: 'SG'
    },
    {
      name: 'Cosco Adjustable Rubber Dumbbell Set 20kg Kit',
      sku: 'COS-DUMB-20KG',
      description: 'Chrome Bar + Collars · Heavy Duty Rubber Coated Plates for high durability home gym workout.',
      price: 4499,
      stock: 28,
      imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80&auto=format&fit=crop',
      categoryName: 'Gym & Fitness Gear',
      brandName: 'Cosco'
    },
    {
      name: 'Yonex Nanoflare 1000Z Speed Racquet',
      sku: 'YNX-NF-1000Z',
      description: '4U / G5 · Head Light · Ultra High Modulus Graphite. Smash speed world-record holding racquet.',
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

    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        description: p.description,
        price: p.price,
        stock: p.stock,
        imageUrl: p.imageUrl,
        categoryId,
        brandId,
        brandName: p.brandName
      },
      create: {
        name: p.name,
        sku: p.sku,
        description: p.description,
        price: p.price,
        stock: p.stock,
        imageUrl: p.imageUrl,
        categoryId,
        brandId,
        brandName: p.brandName
      }
    });
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
