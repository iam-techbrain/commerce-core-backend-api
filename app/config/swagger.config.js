const swaggerJSDoc = require('swagger-jsdoc');
const appConfig = require('./app.config');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Enterprise SaaS E-Commerce REST API Documentation',
    version: '1.0.0',
    description: 'Interactive API Documentation for SaaS E-Commerce Express Backend with JWT Authentication',
    contact: {
      name: 'API Support',
      email: appConfig.supportEmail
    }
  },
  servers: [
    {
      url: `http://localhost:${appConfig.port}`,
      description: 'Local Development Server'
    }
  ],
  // 🌟 EXPLICIT TAGS ORDER: Authentication WILL ALWAYS BE FIRST!
  tags: [
    {
      name: 'Authentication',
      description: '🔑 User Registration, Login & Profile Token Endpoints (START HERE)'
    },
    {
      name: 'Products',
      description: '📦 Product Catalog (with Pagination, Search & Image Upload)'
    },
    {
      name: 'Categories',
      description: '📁 Category Management (with Deletion Protection)'
    },
    {
      name: 'Cart',
      description: '🛒 User Shopping Cart & Stock Limit Validation'
    },
    {
      name: 'Orders',
      description: '💳 Order Placement & Razorpay Payment Checkout'
    },
    {
      name: 'Coupons',
      description: '🎟️ Discount Coupon & Promo Code Validation'
    },
    {
      name: 'Addresses',
      description: '🏡 User Shipping & Billing Address Management'
    },
    {
      name: 'Wishlist',
      description: '❤️ Customer Product Wishlist'
    },
    {
      name: 'Reviews',
      description: '⭐ Product Ratings & Reviews'
    },
    {
      name: 'Users',
      description: '👤 User Account Management'
    },
    {
      name: 'Dashboard',
      description: '📊 Store Sales & Revenue Analytics (Admin)'
    },
    {
      name: 'System',
      description: '⚙️ Server Diagnostics & Health Check'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token in the format: Bearer <TOKEN>'
      }
    }
  }
};

const options = {
  swaggerDefinition,
  apis: ['./app/routes/*.js'] // Path to API route files containing Swagger annotations
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
