const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const captainController = require('../controllers/captainController');
const { protect, protectCaptain } = require('../middlewares/auth');
const { captainValidation, paginationValidation, fcmTokenValidation, workingHoursValidation } = require('../utils/validation');


/**
 * @swagger
 * /api/captains/{id}/location:
 *   get:
 *     summary: Get captain location for tracking (Open endpoint for Users and Vendors)
 *     tags: [Captains]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Captain ID
 *     responses:
 *       200:
 *         description: Captain location retrieved successfully
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
 *                       example: "1"
 *                     longitude:
 *                       type: number
 *                       format: float
 *                       example: 31.2357
 *                     latitude:
 *                       type: number
 *                       format: float
 *                       example: 30.0444
 *                     isAvailable:
 *                       type: boolean
 *                       example: true
 *                 message:
 *                   type: string
 *                   example: Captain location retrieved successfully
 */
router.get('/:id/location', captainController.getCaptainLocation);


/**
 * @swagger
 * /api/captains/available:
 *   get:
 *     summary: Get available captains
 *     tags: [Captains]
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
 *     responses:
 *       200:
 *         description: Available captains retrieved successfully
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
 *                     captains:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Captain'
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
 *                   example: Available captains retrieved successfully
 */
router.get('/available', paginationValidation, captainController.getAvailableCaptains);

/**
 * @swagger
 * /api/captains/search:
 *   get:
 *     summary: Search captains by location
 *     tags: [Captains]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - in: query
 *         name: location
 *         required: true
 *         schema:
 *           type: string
 *         description: Location to search for
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
 *     responses:
 *       200:
 *         description: Captain search results retrieved successfully
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
 *                     captains:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Captain'
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
 *                   example: Captain search results retrieved successfully
 */
router.get('/search', paginationValidation, captainController.searchCaptainsByLocation);

// Protected routes - require captain authentication
router.use(protectCaptain);

/**
 * @swagger
 * /api/captains/profile:
 *   get:
 *     summary: Get captain profile
 *     tags: [Captains]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Captain profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Captain'
 *                 message:
 *                   type: string
 *                   example: Profile retrieved successfully
 */
router.get('/profile', captainController.getProfile);

/**
 * @swagger
 * /api/captains/profile:
 *   put:
 *     summary: Update captain profile
 *     tags: [Captains]
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
 *             properties:
 *               userName:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 description: Captain username
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Captain email
 *               phoneNumber:
 *                 type: string
 *                 description: Captain phone number
 *               currentLocation:
 *                 type: string
 *                 maxLength: 200
 *                 description: Captain current location
 *     responses:
 *       200:
 *         description: Captain profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Captain'
 *                 message:
 *                   type: string
 *                   example: Profile updated successfully
 */
router.put('/profile', upload.single('photo'), captainValidation.updateProfile, captainController.updateProfile);

/**
 * @swagger
 * /api/captains/status:
 *   get:
 *     summary: Get captain status
 *     tags: [Captains]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Captain status retrieved successfully
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
 *                       description: Captain ID
 *                     isAvailable:
 *                       type: boolean
 *                       description: Captain availability status
 *                     isDelivering:
 *                       type: boolean
 *                       description: Whether captain is currently delivering
 *                     activeOrderId:
 *                       type: string
 *                       description: Active order ID (if delivering)
 *                 message:
 *                   type: string
 *                   example: Status retrieved successfully
 */
router.get('/status', captainController.getStatus);

/**
 * @swagger
 * /api/captains/status:
 *   put:
 *     summary: Update captain availability status
 *     tags: [Captains]
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
 *               - isAvailable
 *             properties:
 *               isAvailable:
 *                 type: boolean
 *                 description: Captain availability status
 *     responses:
 *       200:
 *         description: Captain status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Captain'
 *                 message:
 *                   type: string
 *                   example: Status updated successfully
 */
router.put('/status', captainValidation.updateStatus, captainController.updateStatus);

/**
 * @swagger
 * /api/captains/location:
 *   get:
 *     summary: Get captain location
 *     tags: [Captains]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Captain location retrieved successfully
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
 *                       description: Captain ID
 *                     currentLocation:
 *                       type: string
 *                       description: Captain current location
 *                 message:
 *                   type: string
 *                   example: Location retrieved successfully
 */
router.get('/location', captainController.getLocation);

/**
 * @swagger
 * /api/captains/location:
 *   put:
 *     summary: Update captain location
 *     tags: [Captains]
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
 *               - longitude
 *               - latitude
 *             properties:
 *               longitude:
 *                 type: number
 *                 format: float
 *                 minimum: -180
 *                 maximum: 180
 *                 description: Longitude coordinate
 *               latitude:
 *                 type: number
 *                 format: float
 *                 minimum: -90
 *                 maximum: 90
 *                 description: Latitude coordinate
 *     responses:
 *       200:
 *         description: Captain location updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Captain'
 *                 message:
 *                   type: string
 *                   example: Location updated successfully
 */
router.put('/location', captainValidation.updateLocation, captainController.updateLocation);

/**
 * @swagger
 * /api/captains/orders:
 *   get:
 *     summary: Get captain orders
 *     tags: [Captains]
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
 *         description: Captain orders retrieved successfully
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
 *                   example: Captain orders retrieved successfully
 */
router.get('/orders', paginationValidation, captainController.getCaptainOrders);

/**
 * @swagger
 * /api/captains/stats:
 *   get:
 *     summary: Get captain statistics
 *     tags: [Captains]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Captain statistics retrieved successfully
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
 *                       description: Total orders handled
 *                     completedOrders:
 *                       type: integer
 *                       description: Successfully completed orders
 *                     currentRating:
 *                       type: number
 *                       format: float
 *                       description: Current captain rating
 *                     totalRatings:
 *                       type: integer
 *                       description: Total number of ratings received
 *                 message:
 *                   type: string
 *                   example: Captain statistics retrieved successfully
 */
router.get('/stats', captainController.getCaptainStats);

/**
 * @swagger
 * /api/captains/fcm-token:
 *   put:
 *     summary: Update captain FCM token for notifications
 *     tags: [Captains]
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
router.put('/fcm-token', fcmTokenValidation.updateToken, captainController.updateFCMToken);

/**
 * @swagger
 * /api/captains/working-hours:
 *   put:
 *     summary: Update captain working hours
 *     tags: [Captains]
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
 *             properties:
 *               workingHoursStart:
 *                 type: string
 *                 pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *                 example: "09:00"
 *                 description: Working hours start time in HH:MM format (24-hour)
 *               workingHoursEnd:
 *                 type: string
 *                 pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *                 example: "17:00"
 *                 description: Working hours end time in HH:MM format (24-hour)
 *     responses:
 *       200:
 *         description: Working hours updated successfully
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
 *                     userName:
 *                       type: string
 *                     workingHoursStart:
 *                       type: string
 *                     workingHoursEnd:
 *                       type: string
 *                 message:
 *                   type: string
 *                   example: Working hours updated successfully
 */
// Working hours are now managed by admin only - see /api/admin/captains/{id}/working-hours
// router.put('/working-hours', workingHoursValidation.updateHours, captainController.updateWorkingHours);

/**
 * @swagger
 * /api/captains/location:
 *   put:
 *     summary: Update captain location (cache only)
 *     tags: [Captains]
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
 *               - longitude
 *               - latitude
 *             properties:
 *               longitude:
 *                 type: number
 *                 format: float
 *                 minimum: -180
 *                 maximum: 180
 *                 example: 31.2357
 *                 description: Longitude coordinate
 *               latitude:
 *                 type: number
 *                 format: float
 *                 minimum: -90
 *                 maximum: 90
 *                 example: 30.0444
 *                 description: Latitude coordinate
 *     responses:
 *       200:
 *         description: Location updated successfully
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
 *                       example: "1"
 *                     longitude:
 *                       type: number
 *                       format: float
 *                       example: 31.2357
 *                     latitude:
 *                       type: number
 *                       format: float
 *                       example: 30.0444
 *                     message:
 *                       type: string
 *                       example: "Location updated successfully"
 *                 message:
 *                   type: string
 *                   example: Location updated successfully
 */
router.put('/location', protectCaptain, captainController.updateLocation);

/**
 * @swagger
 * /api/captains/availability:
 *   put:
 *     summary: Update captain availability
 *     tags: [Captains]
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
 *               - isAvailable
 *             properties:
 *               isAvailable:
 *                 type: boolean
 *                 example: true
 *                 description: Captain availability status
 *     responses:
 *       200:
 *         description: Availability updated successfully
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
 *                       example: "1"
 *                     isAvailable:
 *                       type: boolean
 *                       example: true
 *                     longitude:
 *                       type: number
 *                       format: float
 *                       example: 31.2357
 *                     latitude:
 *                       type: number
 *                       format: float
 *                       example: 30.0444
 *                 message:
 *                   type: string
 *                   example: Availability updated successfully
 */
router.put('/availability', protectCaptain, captainController.updateAvailability);

/**
 * @swagger
 * /captains/account:
 *   delete:
 *     summary: Delete captain account
 *     tags: [Captains]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 */
router.delete('/account', captainController.deleteAccount);

module.exports = router;