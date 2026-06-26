const { body, param, query, validationResult } = require("express-validator");

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: errors.array(),
    });
  }
  next();
};

// User validation rules
const userValidation = {
  signup: [
    body("userName")
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage("Username must be between 3 and 50 characters"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("phoneNumber")
      .matches(/^\+?[\d\s\-\(\)]+$/)
      .withMessage("Please provide a valid phone number"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      ),
    body("address")
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage("Address must be less than 200 characters"),
    body("neighborhoodId")
      .isInt({ min: 1 })
      .withMessage("Valid neighborhood ID is required"),
    body("fcmToken")
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage("FCM token must not be empty when provided"),
    handleValidationErrors,
  ],
  login: [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
    handleValidationErrors,
  ],
  updateProfile: [
    body("userName")
      .optional()
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage("Username must be between 3 and 50 characters"),
    body("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("phoneNumber")
      .optional()
      .matches(/^\+?[\d\s\-\(\)]+$/)
      .withMessage("Please provide a valid phone number"),
    body("address")
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage("Address must be less than 200 characters"),
    body("fcmToken")
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage("FCM token must not be empty when provided"),
    handleValidationErrors,
  ],
};

// Vendor validation rules
const vendorValidation = {
  signup: [
    body("vendorName")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Vendor name must be between 2 and 100 characters"),
    body("contactNumber")
      .matches(/^\+?[\d\s\-\(\)]+$/)
      .withMessage("Please provide a valid contact number"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      ),
    body("address")
      .trim()
      .notEmpty()
      .withMessage("Address is required")
      .isLength({ max: 200 })
      .withMessage("Address must be less than 200 characters"),
    body("longitude")
      .isFloat({ min: -180, max: 180 })
      .withMessage(
        "Longitude is required and must be a valid coordinate between -180 and 180",
      ),
    body("latitude")
      .isFloat({ min: -90, max: 90 })
      .withMessage(
        "Latitude is required and must be a valid coordinate between -90 and 90",
      ),
    body("description")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Description must be less than 500 characters"),
    body("image")
      .optional()
      .isString()
      .withMessage("Image must be a base64 encoded string"),
    body("neighborhoodId")
      .isInt({ min: 1 })
      .withMessage("Valid neighborhood ID is required"),
    body("fcmToken")
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage("FCM token must not be empty when provided"),
    handleValidationErrors,
  ],
  updateProfile: [
    body("vendorName")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Vendor name must be between 2 and 100 characters"),
    body("contactNumber")
      .optional()
      .matches(/^\+?[\d\s\-\(\)]+$/)
      .withMessage("Please provide a valid contact number"),
    body("address")
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage("Address must be less than 200 characters"),
    body("description")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Description must be less than 500 characters"),
    body("image")
      .optional()
      .isString()
      .withMessage("Image must be a base64 encoded string"),
    body("longitude")
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage("Longitude must be a valid coordinate between -180 and 180"),
    body("latitude")
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage("Latitude must be a valid coordinate between -90 and 90"),
    body("fcmToken")
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage("FCM token must not be empty when provided"),
    handleValidationErrors,
  ],
  updateStatus: [
    body("isOpen")
      .isIn(["true", "false"])
      .withMessage('isOpen must be either "true" or "false"'),
    handleValidationErrors,
  ],
  login: [
    body("contactNumber")
      .matches(/^\+?[\d\s\-\(\)]+$/)
      .withMessage("Please provide a valid contact number"),
    body("password").notEmpty().withMessage("Password is required"),
    handleValidationErrors,
  ],
};

// Captain validation rules
const captainValidation = {
  signup: [
    body("userName")
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage("Username must be between 3 and 50 characters"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("phoneNumber")
      .matches(/^\+?[\d\s\-\(\)]+$/)
      .withMessage("Please provide a valid phone number"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      ),
    body("longitude")
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage("Longitude must be a valid coordinate between -180 and 180"),
    body("latitude")
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage("Latitude must be a valid coordinate between -90 and 90"),
    body("fcmToken")
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage("FCM token must not be empty when provided"),
    body("workingHoursStart")
      .optional()
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Working hours start must be in HH:MM format (24-hour)"),
    body("workingHoursEnd")
      .optional()
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Working hours end must be in HH:MM format (24-hour)"),
    handleValidationErrors,
  ],
  login: [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
    handleValidationErrors,
  ],
  updateProfile: [
    body("userName")
      .optional()
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage("Username must be between 3 and 50 characters")
      .matches(/^[a-zA-Z0-9_\u0600-\u06FF\s]+$/)
      .withMessage(
        "Username can only contain letters, numbers, underscores, spaces, and Arabic characters",
      ),
    body("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("phoneNumber")
      .optional()
      .matches(/^\+?[\d\s\-\(\)]+$/)
      .withMessage("Please provide a valid phone number"),
    body("longitude")
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage("Longitude must be a valid coordinate between -180 and 180"),
    body("latitude")
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage("Latitude must be a valid coordinate between -90 and 90"),
    body("fcmToken")
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage("FCM token must not be empty when provided"),
    body("workingHoursStart")
      .optional()
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Working hours start must be in HH:MM format (24-hour)"),
    body("workingHoursEnd")
      .optional()
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Working hours end must be in HH:MM format (24-hour)"),
    handleValidationErrors,
  ],
  updateStatus: [
    body("isAvailable")
      .isBoolean()
      .withMessage("isAvailable must be a boolean value"),
    handleValidationErrors,
  ],
  updateLocation: [
    body("longitude")
      .isFloat({ min: -180, max: 180 })
      .withMessage("Valid longitude is required (between -180 and 180)"),
    body("latitude")
      .isFloat({ min: -90, max: 90 })
      .withMessage("Valid latitude is required (between -90 and 90)"),
    handleValidationErrors,
  ],
};

// Order validation rules
const orderValidation = {
  createByUser: [
    body("vendorId").isInt().withMessage("Valid vendor ID is required"),
    body("description")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Description must be less than 500 characters"),
    body("additionalNotes")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Additional notes must be less than 500 characters"),

    body("userLongitude")
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage(
        "User longitude must be a valid coordinate between -180 and 180",
      ),
    body("userLatitude")
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage(
        "User latitude must be a valid coordinate between -90 and 90",
      ),
    body("phoneNumber")
      .matches(/^\+?[\d\s\-\(\)]+$/)
      .withMessage("Please provide a valid phone number"),
    body("neighborhoodId")
      .isInt({ min: 1 })
      .withMessage("Valid neighborhood ID is required when provided"),
    handleValidationErrors,
  ],
  createByVendor: [
    body("userId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Valid user ID is required when provided"),
    body("description")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Description must be less than 500 characters"),
    body("additionalNotes")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Additional notes must be less than 500 characters"),
    body("userAddress")
      .trim()
      .notEmpty()
      .withMessage("User address is required")
      .isLength({ max: 200 })
      .withMessage("User address must be less than 200 characters"),
    body("userLongitude")
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage(
        "User longitude must be a valid coordinate between -180 and 180",
      ),
    body("userLatitude")
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage(
        "User latitude must be a valid coordinate between -90 and 90",
      ),
    body("phoneNumber")
      .matches(/^\+?[\d\s\-\(\)]+$/)
      .withMessage("Please provide a valid phone number"),
    body("neighborhoodId")
      .isInt({ min: 1 })
      .withMessage("Valid neighborhood ID is required when provided"),
    body("waitingTime")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Waiting time must be a positive integer (in minutes)"),
    handleValidationErrors,
  ],
  vendorCounterOffer: [
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required")
      .isLength({ max: 500 })
      .withMessage("Description must be less than 500 characters"),
    body("additionalNotes")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Additional notes must be less than 500 characters"),
    body("price")
      .isFloat({ min: 0 })
      .withMessage("Price must be a positive number"),
    body("waitingTime")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Waiting time must be a positive integer (in minutes)"),
    handleValidationErrors,
  ],
  idParam: [
    param("id").isInt({ min: 1 }).withMessage("Valid order ID is required"),
    handleValidationErrors,
  ],
  rateOrder: [
    body("rating")
      .isFloat({ min: 1, max: 5 })
      .withMessage("Rating must be between 1 and 5"),
    handleValidationErrors,
  ],
};

// Menu validation rules
const menuValidation = {
  create: [
    body("photo")
      .isBase64()
      .withMessage("Photo must be a base64 encoded string"),
    handleValidationErrors,
  ],
  update: [
    body("photo")
      .isString()
      .withMessage("Photo must be a base64 encoded string"),
    handleValidationErrors,
  ],
  idParam: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("Menu ID must be a positive integer"),
    handleValidationErrors,
  ],
};

// Complain validation rules
const complainValidation = {
  create: [
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required")
      .isLength({ max: 1000 })
      .withMessage("Description must be less than 1000 characters"),
    body("type")
      .isIn(["USER", "VENDOR", "CAPTAIN"])
      .withMessage("Type must be one of: USER, VENDOR, CAPTAIN"),
    handleValidationErrors,
  ],
};

// Vendor Complain validation rules
const vendorComplainValidation = {
  create: [
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required")
      .isLength({ max: 1000 })
      .withMessage("Description must be less than 1000 characters"),
    body("type")
      .isIn(["USER", "VENDOR", "CAPTAIN"])
      .withMessage("Type must be one of: USER, VENDOR, CAPTAIN"),
    handleValidationErrors,
  ],
};

// Neighborhood validation rules
const neighborhoodValidation = {
  create: [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Neighborhood name is required")
      .isLength({ min: 2, max: 100 })
      .withMessage("Neighborhood name must be between 2 and 100 characters"),
    handleValidationErrors,
  ],
  update: [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Neighborhood name is required")
      .isLength({ min: 2, max: 100 })
      .withMessage("Neighborhood name must be between 2 and 100 characters"),
    handleValidationErrors,
  ],
  idParam: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("Valid neighborhood ID is required"),
    handleValidationErrors,
  ],
};

// Vendor pricing validation rules
const vendorPricingValidation = {
  setPrice: [
    body("vendorId")
      .isInt({ min: 1 })
      .withMessage("Valid vendor ID is required"),
    body("neighborhoodId")
      .isInt({ min: 1 })
      .withMessage("Valid neighborhood ID is required"),
    body("price")
      .isFloat({ min: 0 })
      .withMessage("Price must be a positive number"),
    handleValidationErrors,
  ],
  neighborhoodParam: [
    param("neighborhoodId")
      .isInt({ min: 1 })
      .withMessage("Valid neighborhood ID is required"),
    handleValidationErrors,
  ],
};

// Query validation for pagination
const paginationValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  handleValidationErrors,
];

// FCM Token validation rules
const fcmTokenValidation = {
  updateToken: [
    body("fcmToken")
      .trim()
      .notEmpty()
      .withMessage("FCM token is required")
      .isLength({ min: 1 })
      .withMessage("FCM token must not be empty"),
    handleValidationErrors,
  ],
};

// Captain Request validation rules
const captainRequestValidation = {
  submitRequest: [
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required")
      .isLength({ min: 10, max: 1000 })
      .withMessage("Description must be between 10 and 1000 characters"),
    handleValidationErrors,
  ],
  replyToRequest: [
    body("status")
      .isIn(["APPROVED", "REJECTED"])
      .withMessage("Status must be either APPROVED or REJECTED"),
    body("reply")
      .trim()
      .notEmpty()
      .withMessage("Reply is required")
      .isLength({ min: 5, max: 500 })
      .withMessage("Reply must be between 5 and 500 characters"),
    handleValidationErrors,
  ],
  idParam: [
    param("id").isInt({ min: 1 }).withMessage("Valid request ID is required"),
    handleValidationErrors,
  ],
};

// Working Hours validation rules
const workingHoursValidation = {
  updateHours: [
    body("workingHoursStart")
      .optional()
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Working hours start must be in HH:MM format (24-hour)"),
    body("workingHoursEnd")
      .optional()
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Working hours end must be in HH:MM format (24-hour)"),
    handleValidationErrors,
  ],
};

// Admin validation rules
const adminValidation = {
  signup: [
    body("userName"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("phoneNumber")
      .matches(/^\+?[\d\s\-\(\)]+$/)
      .withMessage("Please provide a valid phone number"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      ),
    body("address").trim().notEmpty().withMessage("Address is required"),
    body("neighborhood_name")
      .trim()
      .notEmpty()
      .withMessage("Neighborhood name is required"),
    body("fcmToken")
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage("FCM token must not be empty when provided"),
    handleValidationErrors,
  ],
  login: [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
    handleValidationErrors,
  ],
  updateProfile: [
    body("userName").optional(),
    body("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("phoneNumber")
      .optional()
      .matches(/^\+?[\d\s\-\(\)]+$/)
      .withMessage("Please provide a valid phone number"),
    body("address")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Address cannot be empty when provided"),
    body("neighborhoodId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Valid neighborhood ID is required when provided"),
    body("fcmToken")
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage("FCM token must not be empty when provided"),
    handleValidationErrors,
  ],
  lockStatus: [
    body("isLocked")
      .isBoolean()
      .withMessage("isLocked must be a boolean value"),
    handleValidationErrors,
  ],
};

module.exports = {
  userValidation,
  vendorValidation,
  captainValidation,
  orderValidation,
  menuValidation,
  complainValidation,
  vendorComplainValidation,
  neighborhoodValidation,
  vendorPricingValidation,
  fcmTokenValidation,
  captainRequestValidation,
  workingHoursValidation,
  adminValidation,
  paginationValidation,
  handleValidationErrors,
};
