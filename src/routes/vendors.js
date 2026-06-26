const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const vendorController = require('../controllers/vendorController');
const { protect, protectVendor } = require('../middlewares/auth');
const { vendorValidation, paginationValidation, fcmTokenValidation } = require('../utils/validation');

/**
 * @swagger
 * /api/vendors:
 *   get:
 *     summary: Get all vendors
 *     tags: [Vendors]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: isOpen
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by vendor open status
 *       - in: query
 *         name: category
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Filter by category ID
 *     responses:
 *       200:
 *         description: Vendors retrieved successfully
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
 *                     vendors:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Vendor'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *                 message:
 *                   type: string
 *                   example: Vendors retrieved successfully
 */
router.get('/', paginationValidation, vendorController.getAllVendors);

/**
 * @swagger
 * /api/vendors/search:
 *   get:
 *     summary: Search vendors by name or location
 *     tags: [Vendors]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term for vendor name or location
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Filter by category ID
 *     responses:
 *       200:
 *         description: Vendor search results retrieved successfully
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
 *                     vendors:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Vendor'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *                 message:
 *                   type: string
 *                   example: Search results retrieved successfully
 */
router.get('/search', paginationValidation, vendorController.searchVendors);

// Protected routes - require vendor authentication
router.use(protectVendor);

/**
 * @swagger
 * /api/vendors/profile:
 *   get:
 *     summary: Get vendor profile
 *     tags: [Vendors]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Vendor profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Vendor'
 *                 message:
 *                   type: string
 *                   example: Profile retrieved successfully
 */
router.get('/profile', vendorController.getProfile);

/**
 * @swagger
 * /api/vendors/profile:
 *   put:
 *     summary: Update vendor profile
 *     tags: [Vendors]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               vendorName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Vendor name
 *               contactNumber:
 *                 type: string
 *                 description: Vendor contact number
 *               address:
 *                 type: string
 *                 maxLength: 200
 *                 description: Vendor address
 *               longitude:
 *                 type: number
 *                 description: Vendor longitude
 *               latitude:
 *                 type: number
 *                 description: Vendor latitude
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Vendor description
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: encoded vendor image
 *               neighborhoodId:
 *                 type: integer
 *                 minimum: 1
 *                 description: Neighborhood ID
 *               categories:
 *                 type: array
 *                 description: List of category IDs
 *                 items:
 *                   type: integer
 *                   minimum: 1
 *     responses:
 *       200:
 *         description: Vendor profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Vendor'
 *                 message:
 *                   type: string
 *                   example: Profile updated successfully
 */
router.put('/profile', upload.single('image'), vendorValidation.updateProfile, vendorController.updateProfile);

/**
 * @swagger
 * /api/vendors/status:
 *   get:
 *     summary: Get vendor status
 *     tags: [Vendors]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Vendor status retrieved successfully
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
 *                     id:
 *                       type: string
 *                       description: Vendor ID
 *                     isOpen:
 *                       type: string
 *                       enum: [true, false]
 *                       description: Vendor open status
 *                 message:
 *                   type: string
 *                   example: Status retrieved successfully
 */
router.get('/status', vendorController.getStatus);

/**
 * @swagger
 * /api/vendors/status:
 *   put:
 *     summary: Update vendor status (open/closed)
 *     tags: [Vendors]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isOpen
 *             properties:
 *               isOpen:
 *                 type: string
 *                 enum: [true, false]
 *                 description: Vendor open status
 *     responses:
 *       200:
 *         description: Vendor status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Vendor'
 *                 message:
 *                   type: string
 *                   example: Status updated successfully
 */
router.put('/status', vendorValidation.updateStatus, vendorController.updateStatus);

/**
 * @swagger
 * /api/vendors/orders:
 *   get:
 *     summary: Get vendor orders
 *     tags: [Vendors]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, COUNTER_OFFER_SENT, COUNTER_OFFER_ACCEPTED, ACCEPTED_BY_CAPTAIN, DELIVERED, CANCELLED]
 *         description: Filter by order status
 *     responses:
 *       200:
 *         description: Vendor orders retrieved successfully
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
 *                     orders:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Order'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *                 message:
 *                   type: string
 *                   example: Vendor orders retrieved successfully
 */
router.get('/orders', paginationValidation, vendorController.getVendorOrders);

/**
 * @swagger
 * /api/vendors/stats:
 *   get:
 *     summary: Get vendor statistics
 *     tags: [Vendors]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Vendor statistics retrieved successfully
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
 *                     totalOrders:
 *                       type: integer
 *                       description: Total orders received
 *                     completedOrders:
 *                       type: integer
 *                       description: Successfully completed orders
 *                     pendingOrders:
 *                       type: integer
 *                       description: Pending orders
 *                     rejectedOrders:
 *                       type: integer
 *                       description: Rejected orders
 *                     completionRate:
 *                       type: string
 *                       description: Order completion rate percentage
 *                 message:
 *                   type: string
 *                   example: Vendor statistics retrieved successfully
 */
// router.get('/stats', vendorController.getVendorStats);

/**
 * @swagger
 * /api/vendors/fcm-token:
 *   put:
 *     summary: Update vendor FCM token for notifications
 *     tags: [Vendors]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fcmToken
 *             properties:
 *               fcmToken:
 *                 type: string
 *                 description: Firebase Cloud Messaging token
 *     responses:
 *       200:
 *         description: FCM token updated successfully
 */
router.put('/fcm-token', fcmTokenValidation.updateToken, vendorController.updateFCMToken);

/**
 * @swagger
 * /vendors/account:
 *   delete:
 *     summary: Delete vendor account
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 */
router.delete('/account', vendorController.deleteAccount);

module.exports = router;