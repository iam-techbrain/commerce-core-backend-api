const appRoutes = require('./App.routes');
const authRoutes = require('./Auth.routes');
const dashboardRoutes = require('./Dashboard.routes');
const categoryRoutes = require('./Category.routes');
const brandRoutes = require('./Brand.routes');
const productRoutes = require('./Product.routes');
const userRoutes = require('./User.routes');
const addressRoutes = require('./Address.routes');
const cartRoutes = require('./Cart.routes');
const couponRoutes = require('./Coupon.routes');
const orderRoutes = require('./Order.routes');
const reviewRoutes = require('./Review.routes');
const wishlistRoutes = require('./Wishlist.routes');
const attributeRoutes = require('./Attribute.routes');

const registerRoutes = (app) => {
  app.use('/api/app', appRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/brands', brandRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/attributes', attributeRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/addresses', addressRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/coupons', couponRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/wishlist', wishlistRoutes);
};

module.exports = registerRoutes;
