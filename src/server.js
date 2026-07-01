const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
require("dotenv").config();

// Initialize Firebase
const { initializeFirebase } = require("./config/firebase");

const prisma = require("./utils/prisma");

// Import Swagger specs
const swaggerSpecs = require("./config/swagger");

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const vendorRoutes = require("./routes/vendors");
const captainRoutes = require("./routes/captains");
const orderRoutes = require("./routes/orders");
const menuRoutes = require("./routes/menus");
const complainRoutes = require("./routes/complains");
const vendorComplainRoutes = require("./routes/vendorComplains");
const neighborhoodRoutes = require("./routes/neighborhoods");
const vendorPricingRoutes = require("./routes/vendorPricing");
const captainRequestRoutes = require("./routes/captainRequests");
const adminRoutes = require("./routes/admin");
const adminSignupRoutes = require("./routes/adminSignup");
const categoryRoutes = require("./routes/categories");
const itemRoutes = require("./routes/items");
const announcementRoutes = require("./routes/announcements");

// Import middleware
const { errorHandler } = require("./middlewares/errorHandler");
const { notFound } = require("./middlewares/notFound");
const { extractTenant } = require("./middlewares/tenant");

const app = express();

// Initialize Firebase
initializeFirebase();

// Initialize captain location cache
const captainService = require("./services/captainService");
captainService.initializeCache().catch(console.error);

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? "*"
        : ["http://localhost:3000", "http://localhost:3001"],
    credentials: false,
  }),
);

// // Rate limiting
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
//   message: {
//     error: 'Too many requests from this IP, please try again later.'
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// BigInt serialization fix
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (data) {
    const jsonString = JSON.stringify(data, (key, value) =>
      typeof value === "bigint" ? value.toString() : value,
    );
    return originalJson.call(this, JSON.parse(jsonString));
  };
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Swagger documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpecs, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "SADAT Delivery API Documentation",
    customfavIcon: "/favicon.ico",
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showRequestHeaders: true,
    },
  }),
);

// Admin signup routes (without tenant middleware)
app.use("/api/admin-signup", adminSignupRoutes);

// API routes - Apply tenant middleware to all API routes
app.use("/api/auth", extractTenant, authRoutes);
app.use("/api/users", extractTenant, userRoutes);
app.use("/api/vendors", extractTenant, vendorRoutes);
app.use("/api/captains", extractTenant, captainRoutes);
app.use("/api/orders", extractTenant, orderRoutes);
app.use("/api/menus", extractTenant, menuRoutes);
app.use("/api/complains", extractTenant, complainRoutes);
app.use("/api/vendor-complains", extractTenant, vendorComplainRoutes);
app.use("/api/neighborhoods", extractTenant, neighborhoodRoutes);
app.use("/api/vendor-pricing", extractTenant, vendorPricingRoutes);
app.use("/api/captain-requests", extractTenant, captainRequestRoutes);
app.use("/api/categories", extractTenant, categoryRoutes);
app.use("/api/items", extractTenant, itemRoutes);
app.use("/api/admin", extractTenant, adminRoutes);
app.use("/api/announcements", extractTenant, announcementRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Received SIGINT. Performing graceful shutdown...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Received SIGTERM. Performing graceful shutdown...");
  await prisma.$disconnect();
  process.exit(0);
});

const PORT = process.env.PORT_TEST || 3004;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
