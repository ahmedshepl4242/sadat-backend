const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const authController = require('../controllers/authController');
const categoryController = require('../controllers/categoryController');
const { userValidation, vendorValidation, captainValidation } = require('../utils/validation');

/**
 * @swagger
 * /api/auth/signup/user:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userName
 *               - email
 *               - phoneNumber
 *               - password
 *             properties:
 *               userName:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 pattern: '^[a-zA-Z0-9_]+$'
 *               email:
 *                 type: string
 *                 format: email
 *               phoneNumber:
 *                 type: string
 *                 pattern: '^\+?[\\d\\s\\-\\(\\)]+$'
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'
 *               address:
 *                 type: string
 *                 maxLength: 200
 *               neighborhoodId:
 *                 type: string
 *                 description: 'Neighborhood ID'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *       400:
 *         description: Validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/signup/user', userValidation.signup, authController.userSignup);

/**
 * @swagger
 * /api/auth/login/user:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                 message:
 *                   type: string
 *                   example: User logged in successfully
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login/user', userValidation.login, authController.userLogin);

/**
 * @swagger
 * /api/auth/signup/vendor:
 *   post:
 *     summary: Register a new vendor
 *     tags: [Authentication]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vendorName
 *               - contactNumber
 *               - password
 *               - address
 *               - description
 *               - latitude
 *               - longitude
 *               - neighborhoodId
 *             properties:
 *               vendorName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'
 *               contactNumber:
 *                 type: string
 *                 pattern: '^\+?[\\d\\s\\-\\(\\)]+$'
 *               address:
 *                 type: string
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               image:
 *                 type: string
 *                 format: binary
 *               longitude:
 *                 type: number
 *                 format: float
 *               latitude:
 *                 type: number
 *                 format: float
 *               neighborhoodId:
 *                 type: string
 *                 description: 'Neighborhood ID'
 *               categories:
 *                 type: array
 *                 description: List of category IDs
 *                 items:
 *                   type: integer
 *                   minimum: 1
 *     responses:
 *       201:
 *         description: Vendor registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     vendor:
 *                       $ref: '#/components/schemas/Vendor'
 *                     token:
 *                       type: string
 *                 message:
 *                   type: string
 *                   example: Vendor registered successfully
 *       400:
 *         description: Validation error or vendor already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/signup/vendor', vendorValidation.signup, authController.vendorSignup);

/**
 * @swagger
 * /api/auth/login/vendor:
 *   post:
 *     summary: Vendor login
 *     tags: [Authentication]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contactNumber
 *               - password
 *             properties:
 *               contactNumber:
 *                 type: string
 *                 pattern: '^\+?[\\d\\s\\-\\(\\)]+$'
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'
 *     responses:
 *       200:
 *         description: Vendor logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     vendor:
 *                       $ref: '#/components/schemas/Vendor'
 *                     token:
 *                       type: string
 *                 message:
 *                   type: string
 *                   example: Vendor logged in successfully
 *       401:
 *         description: Vendor not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login/vendor', vendorValidation.login, authController.vendorLogin);

/**
 * @swagger
 * /api/auth/signup/captain:
 *   post:
 *     summary: Register a new captain
 *     tags: [Authentication]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - userName
 *               - email
 *               - phoneNumber
 *               - password
 *             properties:
 *               userName:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 pattern: '^[a-zA-Z0-9_]+$'
 *               email:
 *                 type: string
 *                 format: email
 *               phoneNumber:
 *                 type: string
 *                 pattern: '^\+?[\\d\\s\\-\\(\\)]+$'
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'
 *               nationalId:
 *                 type: string
 *                 description: National ID number
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: Captain photo file to upload
 *     responses:
 *       201:
 *         description: Captain registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     captain:
 *                       $ref: '#/components/schemas/Captain'
 *                     token:
 *                       type: string
 *                 message:
 *                   type: string
 *                   example: Captain registered successfully
 *       400:
 *         description: Validation error or captain already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/signup/captain', upload.single('photo'), captainValidation.signup, authController.captainSignup);

/**
 * @swagger
 * /api/auth/login/captain:
 *   post:
 *     summary: Captain login
 *     tags: [Authentication]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Captain logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     captain:
 *                       $ref: '#/components/schemas/Captain'
 *                     token:
 *                       type: string
 *                 message:
 *                   type: string
 *                   example: Captain logged in successfully
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login/captain', captainValidation.login, authController.captainLogin);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *               - type
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token
 *               type:
 *                 type: string
 *                 enum: [user, vendor, captain]
 *                 description: The type of user (user, vendor, or captain)
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       oneOf:
 *                         - $ref: '#/components/schemas/User'
 *                         - $ref: '#/components/schemas/Vendor'
 *                         - $ref: '#/components/schemas/Captain'
 *                     token:
 *                       type: string
 *                       description: New JWT access token
 *                     refreshToken:
 *                       type: string
 *                       description: New refresh token
 *                 message:
 *                   type: string
 *                   example: Tokens refreshed successfully
 *       401:
 *         description: Invalid refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/refresh-token', authController.refreshToken);

/**
 * @swagger
 * /api/auth/vendor-registration-data:
 *   get:
 *     summary: Get vendor registration data (neighborhoods and categories)
 *     tags: [Authentication]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *     responses:
 *       200:
 *         description: Vendor registration data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     neighborhoods:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                 message:
 *                   type: string
 *                   example: Vendor registration data retrieved successfully
 */
router.get('/vendor-registration-data', categoryController.getVendorRegistrationData);

// ── Forgot password ──────────────────────────────────────────────────────────
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-otp', authController.verifyOtp);
router.post('/reset-password', authController.resetPassword);

// ── Vendor forgot password (contactNumber-based) ─────────────────────────────
router.post('/vendor/forgot-password', authController.forgotPasswordVendor);
router.post('/vendor/verify-otp', authController.verifyOtpVendor);
router.post('/vendor/reset-password', authController.resetPasswordVendor);

module.exports = router; 