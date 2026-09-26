# Enterprise SaaS E-Commerce Backend API

This repository houses a production-grade, enterprise MVC (Model-View-Controller) Express.js backend tailored for a SaaS E-Commerce application. It provides complete authentication (JWT + Bcrypt), user address management, product & category catalog, shopping cart engine, discount coupons, **Razorpay Payment Gateway Checkout**, order processing, customer reviews, interactive **Swagger UI Documentation**, and clean error handling.

---

## 📘 Interactive API Documentation (Swagger UI)

Interactive Swagger UI documentation is live at:
👉 **`http://localhost:5000/api-docs`**

You can visually test all 10 API modules directly from your browser:
* **Authentication**: `/api/auth/register`, `/api/auth/login`, `/api/auth/profile`
* **Users & Addresses**: `/api/users`, `/api/addresses`
* **Category & Products**: `/api/categories`, `/api/products` (With image upload & deletion constraints)
* **Cart Management**: `/api/cart`, `/api/cart/:itemId`, `/api/cart/clear` (With stock limits verification)
* **Coupons & Offers**: `/api/coupons`, `/api/coupons/apply`
* **Razorpay Orders & Checkout**: `/api/orders/create`, `/api/orders/verify`, `/api/orders/my-orders`, `/api/orders/admin/all`
* **Reviews & Ratings**: `/api/reviews`, `/api/reviews/product/:productId`

---

## 💳 Razorpay Payment Gateway Credentials

* **Key ID**: `rzp_test_U8x8IJzoiGUV9Q`
* **Key Secret**: Configured securely in `.env`
* **Support Email**: `afzal@schooldigitalised.com`

---

## 🏗️ Architecture & Project Directory Structure

```text
Back-End/
├── app/
│   ├── config/
│   │   ├── app.config.js           # Environment, JWT & Razorpay credentials
│   │   ├── db.config.js            # Database configuration
│   │   ├── swagger.config.js       # Swagger OpenAPI specifications configuration
│   │   └── init.js                 # Unified configuration exporter
│   ├── database/
│   │   ├── Prisma.database.js      # Prisma ORM Singleton DB Client (SQLite / PostgreSQL)
│   │   ├── Mongo.database.js       # MongoDB connection initializer
│   │   ├── Redis.database.js       # Redis cache & session store initializer
│   │   └── init.js                 # Database startup orchestration
│   ├── routes/
│   │   ├── App.routes.js           # Health status routes
│   │   ├── Auth.routes.js          # Authentication routes
│   │   ├── User.routes.js          # User management routes
│   │   ├── Address.routes.js       # Shipping & billing address routes
│   │   ├── Category.routes.js      # Category management routes
│   │   ├── Product.routes.js       # Product management routes
│   │   ├── Cart.routes.js          # Shopping cart routes
│   │   ├── Coupon.routes.js        # Discount coupon routes
│   │   ├── Order.routes.js         # Order placement & Razorpay payment routes
│   │   ├── Review.routes.js        # Product rating & review routes
│   │   └── init.js                 # Express router registrar
│   ├── utils/
│   │   └── Logger.util.js          # Formatted system logging utility
│   ├── middleware/
│   │   ├── Auth.middleware.js      # JWT Bearer token verification
│   │   ├── Upload.middleware.js    # Multer image upload & file filter handler
│   │   ├── ErrorHandler.middleware.js # Global error handler
│   │   └── init.js                 # Middleware exporter
│   ├── models/
│   │   └── User.model.js           # User schema model helper
│   ├── controllers/
│   │   ├── App.controller.js       # App status controller
│   │   ├── Auth.controller.js      # Register & login controller
│   │   ├── User.controller.js      # User CRUD controller
│   │   ├── Address.controller.js   # Address CRUD controller
│   │   ├── Category.controller.js  # Category CRUD controller (With product deletion check)
│   │   ├── Product.controller.js   # Product CRUD controller (With image orphan cleanup)
│   │   ├── Cart.controller.js      # Shopping cart controller (With stock limit checks)
│   │   ├── Coupon.controller.js    # Coupon creation & validation controller
│   │   ├── Order.controller.js     # Razorpay order creation & signature verification controller
│   │   └── Review.controller.js    # Product rating & review controller
│   └── helpers/
│       └── App.helper.js           # API JSON response formatters & upload file cleanup utility
├── prisma/
│   ├── schema.prisma               # Prisma relational database models (User, Category, Product, Cart, Order, etc.)
│   └── dev.db                      # SQLite local database file
├── public/
│   ├── uploads/                    # Product & category uploaded image storage
│   └── sitemap.xml                 # XML Sitemap for search engines
├── samples/
│   ├── .env.sample                 # Environment configuration template
│   └── db.conf.sample              # Database configuration template
├── .env                            # Environment variables (Ignored by Git)
├── package.json                    # Dependencies & NPM script commands
└── server.js                       # Express HTTP server entry point
```

---

## ⚡ How Razorpay Checkout Works (2 Steps)

1. **Step 1 - Order Creation (`POST /api/orders/create`)**:
   - React app sends `addressId` & optional `couponCode`.
   - Express checks stock, calculates taxes (18% GST), shipping fees, applies coupon discounts, reserves order items in DB, and generates a **Razorpay Order ID** via Razorpay SDK.
2. **Step 2 - Payment Signature Verification (`POST /api/orders/verify`)**:
   - User completes payment in Razorpay Checkout modal in React.
   - React sends `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature` to Express.
   - Express verifies signature using **HMAC SHA256**, marks order status as `PAID`, clears user cart, and decrements product stock.

---

## 🚀 How to Run the Server

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Sync Database Schema**:
   ```bash
   npx prisma db push
   ```

3. **Start Server**:
   ```bash
   npm start
   npm run dev
   ```
   *The server will run on `http://localhost:5000`.*
   *Swagger Docs will be live at `http://localhost:5000/api-docs`.*
