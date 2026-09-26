const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');

const appConfig = require('./app/config/app.config');
const swaggerSpec = require('./app/config/swagger.config');
const initDatabases = require('./app/database/init');
const registerRoutes = require('./app/routes/init');
const { errorHandler } = require('./app/middleware/init');
const Logger = require('./app/utils/Logger.util');

const app = express();

/**
 * =========================================================================
 * ⚙️ GLOBAL MIDDLEWARES
 * =========================================================================
 */
app.use(cors({
  origin: appConfig.corsOrigin,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from public folder
app.use(express.static(path.join(__dirname, 'public')));

/**
 * =========================================================================
 * 📘 SWAGGER INTERACTIVE API DOCUMENTATION
 * =========================================================================
 */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * =========================================================================
 * 🚀 INITIALIZE DATABASES & ROUTES
 * =========================================================================
 */
(async () => {
  // Connect Databases (Mongo + Redis)
  await initDatabases();

  // Root Welcome Endpoint
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'Welcome to Enterprise SaaS E-Commerce REST API 🚀',
      documentation: `http://localhost:${appConfig.port}/api-docs`,
      environment: appConfig.env,
      version: '1.0.0'
    });
  });

  // Mount Modular Routes
  registerRoutes(app);

  // Global Error Handling Middleware
  app.use(errorHandler);

  // 404 Fallback Handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Endpoint Not Found: ${req.method} ${req.originalUrl}`
    });
  });

  // Start HTTP Server
  app.listen(appConfig.port, () => {
    Logger.info(`=================================================`);
    Logger.info(`🚀 Server Live on:          http://localhost:${appConfig.port}`);
    Logger.info(`📘 Swagger UI Docs:         http://localhost:${appConfig.port}/api-docs`);
    Logger.info(`🔑 Auth APIs:              http://localhost:${appConfig.port}/api/auth`);
    Logger.info(`📊 Dashboard API:          http://localhost:${appConfig.port}/api/dashboard`);
    Logger.info(`=================================================`);
  });
})();
