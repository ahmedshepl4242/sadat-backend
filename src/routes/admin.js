const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const captainController = require('../controllers/captainController');
const captainRequestController = require('../controllers/captainRequestController');
const categoryController = require('../controllers/categoryController');
const { protectAdmin } = require('../middlewares/auth');
const { adminValidation, captainRequestValidation, paginationValidation, fcmTokenValidation } = require('../utils/validation');

/**
 * @swagger
 * /api/admin/signup:
 *   post:
 *     summary: Admin registration
 *     tags: [Admin]
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
 *               - address
 *               - neighborhoodId
 *             properties:
 *               userName:
 *                 type: string
 *                 pattern: '^[a-zA-Z0-9_\s]+$'
 *                 description: Username (letters, numbers, underscores, spaces only)
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Password (min 6 chars, must contain uppercase, lowercase, and number)
 *               address:
 *                 type: string
 *                 description: Admin address
 *               neighborhoodId:
 *                 type: integer
 *                 minimum: 1
 *                 description: Neighborhood ID
 *               fcmToken:
 *                 type: string
 *                 description: FCM token for notifications (optional)
 *     responses:
 *       201:
 *         description: Admin registered successfully
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
 *                     admin:
 *                       $ref: '#/components/schemas/Admin'
 *                     token:
 *                       type: string
 *                       description: JWT authentication token
 *                 message:
 *                   type: string
 *                   example: Admin registered successfully
 */
router.post('/signup', adminValidation.signup, authController.adminSignup);

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     summary: Admin login
 *     tags: [Admin]
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
 *                 description: Admin email
 *               password:
 *                 type: string
 *                 description: Admin password
 *     responses:
 *       200:
 *         description: Admin logged in successfully
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
 *                     admin:
 *                       $ref: '#/components/schemas/Admin'
 *                     token:
 *                       type: string
 *                       description: JWT authentication token
 *                 message:
 *                   type: string
 *                   example: Admin logged in successfully
 */
router.post('/login', adminValidation.login, authController.adminLogin);

/**
 * @swagger
 * /api/admin/profile:
 *   get:
 *     summary: Get admin profile
 *     tags: [Admin]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Admin profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Admin'
 *                 message:
 *                   type: string
 *                   example: Admin profile retrieved successfully
 */
router.get('/profile', protectAdmin, adminController.getProfile);

/**
 * @swagger
 * /api/admin/profile:
 *   put:
 *     summary: Update admin profile
 *     tags: [Admin]
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
 *                 pattern: '^[a-zA-Z0-9_\s]+$'
 *                 description: Username (letters, numbers, underscores, spaces only)
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number
 *               address:
 *                 type: string
 *                 description: Admin address
 *               neighborhoodId:
 *                 type: integer
 *                 minimum: 1
 *                 description: Neighborhood ID
 *               fcmToken:
 *                 type: string
 *                 description: FCM token for notifications
 *     responses:
 *       200:
 *         description: Admin profile updated successfully
 */
router.put('/profile', protectAdmin, adminValidation.updateProfile, adminController.updateProfile);

/**
 * @swagger
 * /api/admin/fcm-token:
 *   put:
 *     summary: Update admin FCM token
 *     tags: [Admin]
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
 *                 description: FCM token for push notifications
 *     responses:
 *       200:
 *         description: FCM token updated successfully
 */
router.put('/fcm-token', protectAdmin, fcmTokenValidation.updateToken, adminController.updateFCMToken);

/**
 * @swagger
 * /api/admin/captains:
 *   get:
 *     summary: Get all captains for admin management (sorted by rating)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - in: query
 *         name: isLocked
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *         description: Filter by locked status
 *     responses:
 *       200:
 *         description: Captains retrieved successfully
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
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "1"
 *                           userName:
 *                             type: string
 *                             example: "john_captain"
 *                           email:
 *                             type: string
 *                             format: email
 *                             example: "john@example.com"
 *                           phoneNumber:
 *                             type: string
 *                             example: "+1234567890"
 *                           longitude:
 *                             type: number
 *                             format: float
 *                             example: 31.2357
 *                           latitude:
 *                             type: number
 *                             format: float
 *                             example: 30.0444
 *                           workingHoursStart:
 *                             type: string
 *                             example: "09:00"
 *                           workingHoursEnd:
 *                             type: string
 *                             example: "17:00"
 *                           isAvailable:
 *                             type: boolean
 *                             example: true
 *                           isLocked:
 *                             type: boolean
 *                             example: false
 *                           lastActivated:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-15T10:30:00Z"
 *                           rating:
 *                             type: number
 *                             format: float
 *                             example: 4.5
 *                           ratingSum:
 *                             type: number
 *                             format: float
 *                             example: 45.0
 *                           ratingCount:
 *                             type: integer
 *                             example: 10
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-01T00:00:00Z"
 *                     total:
 *                       type: integer
 *                       example: 25
 *                 message:
 *                   type: string
 *                   example: Captains retrieved successfully
 */
router.get('/captains', protectAdmin, adminController.getAllCaptains);

/**
 * @swagger
 * /api/admin/captains/{id}/lock-status:
 *   put:
 *     summary: Update captain lock status
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Captain ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isLocked
 *             properties:
 *               isLocked:
 *                 type: boolean
 *                 description: Lock status (true to lock, false to unlock)
 *     responses:
 *       200:
 *         description: Captain lock status updated successfully
 */
router.put('/captains/:id/lock-status', protectAdmin, adminValidation.lockStatus, adminController.updateCaptainLockStatus);
router.delete('/captains/:id', protectAdmin, adminController.deleteCaptain);

/**
 * @swagger
 * /api/admin/vendors:
 *   get:
 *     summary: Get all vendors for admin management
 *     tags: [Admin]
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
 *         name: isLocked
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *         description: Filter by locked status
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
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "1"
 *                           vendorName:
 *                             type: string
 *                             example: "Pizza Palace"
 *                           contactNumber:
 *                             type: string
 *                             example: "+1234567890"
 *                           address:
 *                             type: string
 *                             example: "123 Main St, City"
 *                           isOpen:
 *                             type: string
 *                             enum: ['true', 'false']
 *                             example: "true"
 *                           isLocked:
 *                             type: boolean
 *                             example: false
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-01T00:00:00Z"
 *                           neighborhood:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 example: "1"
 *                               name:
 *                                 type: string
 *                                 example: "Downtown"
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *                 message:
 *                   type: string
 *                   example: Vendors retrieved successfully
 */
router.get('/vendors', protectAdmin, paginationValidation, adminController.getAllVendors);

/**
 * @swagger
 * /api/admin/vendors/{id}/lock-status:
 *   put:
 *     summary: Update vendor lock status
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isLocked
 *             properties:
 *               isLocked:
 *                 type: boolean
 *                 description: Lock status (true to lock, false to unlock)
 *     responses:
 *       200:
 *         description: Vendor lock status updated successfully
 */
router.put('/vendors/:id/lock-status', protectAdmin, adminValidation.lockStatus, adminController.updateVendorLockStatus);
router.delete('/vendors/:id', protectAdmin, adminController.deleteVendor);

/**
 * @swagger
 * /api/admin/captain-requests/{id}/reply:
 *   put:
 *     summary: Reply to a captain request (Admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *               - reply
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [APPROVED, REJECTED]
 *                 description: Decision on the request
 *               reply:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 500
 *                 description: Admin reply to the request
 *     responses:
 *       200:
 *         description: Reply sent successfully
 */
router.put('/captain-requests/:id/reply', protectAdmin, captainRequestValidation.idParam, captainRequestValidation.replyToRequest, adminController.replyToCaptainRequest);

/**
 * @swagger
 * /api/admin/captains/{id}/activate:
 *   put:
 *     summary: Activate captain profile (update lastActivated)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
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
 *         description: Captain activated successfully
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
 *                     userName:
 *                       type: string
 *                       example: "john_captain"
 *                     email:
 *                       type: string
 *                       example: "john@example.com"
 *                     lastActivated:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00Z"
 *                 message:
 *                   type: string
 *                   example: Captain activated successfully
 */
router.put('/captains/:id/activate', protectAdmin, adminController.activateCaptain);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users for admin management
 *     tags: [Admin]
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
 *     responses:
 *       200:
 *         description: Users retrieved successfully
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
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "1"
 *                           userName:
 *                             type: string
 *                             example: "john_user"
 *                           email:
 *                             type: string
 *                             format: email
 *                             example: "john@example.com"
 *                           phoneNumber:
 *                             type: string
 *                             example: "+1234567890"
 *                           address:
 *                             type: string
 *                             example: "123 Main St, City"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-01T00:00:00Z"
 *                           neighborhood:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 example: "1"
 *                               name:
 *                                 type: string
 *                                 example: "Downtown"
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *                 message:
 *                   type: string
 *                   example: Users retrieved successfully
 */
router.get('/users', protectAdmin, paginationValidation, adminController.getAllUsers);
router.delete('/users/:id', protectAdmin, adminController.deleteUser);

/**
 * @swagger
 * /api/admin/captains/{id}/working-hours:
 *   put:
 *     summary: Update captain working hours (Admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Captain ID
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
 *         description: Captain working hours updated successfully
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
 *                     userName:
 *                       type: string
 *                       example: "john_captain"
 *                     workingHoursStart:
 *                       type: string
 *                       example: "09:00"
 *                     workingHoursEnd:
 *                       type: string
 *                       example: "17:00"
 *                 message:
 *                   type: string
 *                   example: Captain working hours updated successfully
 */
router.put('/captains/:id/working-hours', protectAdmin, adminController.updateCaptainWorkingHours);

/**
 * @swagger
 * /api/admin/captains/{id}/orders:
 *   get:
 *     summary: Get orders by captain (Admin)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Captain ID
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
 *                       $ref: '#/components/schemas/Pagination'
 *                 message:
 *                   type: string
 *                   example: Captain orders retrieved successfully
 */
router.get('/captains/:id/orders', protectAdmin, paginationValidation, adminController.getOrdersByCaptain);

/**
 * @swagger
 * /api/admin/users/{id}/orders:
 *   get:
 *     summary: Get orders by user (Admin)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
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
 *         description: User orders retrieved successfully
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
 *                       $ref: '#/components/schemas/Pagination'
 *                 message:
 *                   type: string
 *                   example: User orders retrieved successfully
 */
router.get('/users/:id/orders', protectAdmin, paginationValidation, adminController.getOrdersByUser);

/**
 * @swagger
 * /api/admin/vendors/{id}/orders:
 *   get:
 *     summary: Get orders by vendor (Admin)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor ID
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
 *                       $ref: '#/components/schemas/Pagination'
 *                 message:
 *                   type: string
 *                   example: Vendor orders retrieved successfully
 */
router.get('/vendors/:id/orders', protectAdmin, paginationValidation, adminController.getOrdersByVendor);

/**
 * @swagger
 * /api/admin/statistics/captains/{id}:
 *   get:
 *     summary: Get captain statistics (orders and earnings)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Captain ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-01-01"
 *         description: Start date for statistics (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-01-31"
 *         description: End date for statistics (YYYY-MM-DD)
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
 *                     captainId:
 *                       type: string
 *                       example: "1"
 *                     orderCount:
 *                       type: integer
 *                       example: 25
 *                     totalEarnings:
 *                       type: number
 *                       format: float
 *                       example: 1250.50
 *                     period:
 *                       type: object
 *                       properties:
 *                         startDate:
 *                           type: string
 *                           format: date
 *                           example: "2024-01-01"
 *                         endDate:
 *                           type: string
 *                           format: date
 *                           example: "2024-01-31"
 *                 message:
 *                   type: string
 *                   example: Captain statistics retrieved successfully
 */
router.get('/statistics/captains/:id', protectAdmin, adminController.getCaptainStatistics);

/**
 * @swagger
 * /api/admin/statistics/users/{id}:
 *   get:
 *     summary: Get user statistics (orders and spending)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-01-01"
 *         description: Start date for statistics (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-01-31"
 *         description: End date for statistics (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
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
 *                     userId:
 *                       type: string
 *                       example: "1"
 *                     orderCount:
 *                       type: integer
 *                       example: 15
 *                     totalSpent:
 *                       type: number
 *                       format: float
 *                       example: 750.25
 *                     period:
 *                       type: object
 *                       properties:
 *                         startDate:
 *                           type: string
 *                           format: date
 *                           example: "2024-01-01"
 *                         endDate:
 *                           type: string
 *                           format: date
 *                           example: "2024-01-31"
 *                 message:
 *                   type: string
 *                   example: User statistics retrieved successfully
 */
router.get('/statistics/users/:id', protectAdmin, adminController.getUserStatistics);

/**
 * @swagger
 * /api/admin/statistics/vendors/{id}:
 *   get:
 *     summary: Get vendor statistics (orders and earnings)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-01-01"
 *         description: Start date for statistics (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-01-31"
 *         description: End date for statistics (YYYY-MM-DD)
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
 *                     vendorId:
 *                       type: string
 *                       example: "1"
 *                     orderCount:
 *                       type: integer
 *                       example: 35
 *                     totalEarnings:
 *                       type: number
 *                       format: float
 *                       example: 1750.75
 *                     period:
 *                       type: object
 *                       properties:
 *                         startDate:
 *                           type: string
 *                           format: date
 *                           example: "2024-01-01"
 *                         endDate:
 *                           type: string
 *                           format: date
 *                           example: "2024-01-31"
 *                 message:
 *                   type: string
 *                   example: Vendor statistics retrieved successfully
 */
router.get('/statistics/vendors/:id', protectAdmin, adminController.getVendorStatistics);

/**
 * @swagger
 * /api/admin/captains-cached:
 *   get:
 *     summary: Get cached captain location and availability data
 *     tags: [Admin]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Cached captain data retrieved successfully
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
 *                   additionalProperties:
 *                     type: object
 *                     properties:
 *                       longitude:
 *                         type: number
 *                         format: float
 *                         example: 31.2357
 *                       latitude:
 *                         type: number
 *                         format: float
 *                         example: 30.0444
 *                       isAvailable:
 *                         type: boolean
 *                         example: true
 *                   example:
 *                     "1":
 *                       longitude: 31.2357
 *                       latitude: 30.0444
 *                       isAvailable: true
 *                     "2":
 *                       longitude: 31.2400
 *                       latitude: 30.0500
 *                       isAvailable: false
 *                 message:
 *                   type: string
 *                   example: Cached captain data retrieved successfully
 */
router.get('/captains-cached', protectAdmin, captainController.getCachedCaptainData);
/**
 * @swagger
 * /api/admin/captain-requests/all:
 *   get:
 *     summary: Get all requests (Admin only)
 *     tags: [Admin]
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
 *           enum: [PENDING, APPROVED, REJECTED]
 *         description: Filter by request status
 *     responses:
 *       200:
 *         description: All requests retrieved successfully
 */
router.get('/captain-requests/all', protectAdmin, captainRequestController.getAllRequests);

/**
 * @swagger
 * /api/admin/statistics/captains-overview:
 *   get:
 *     summary: Get all captains statistics overview
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-01-01"
 *         description: Start date for statistics (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-01-31"
 *         description: End date for statistics (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Captains statistics retrieved successfully
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
 *                     captainsStats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           captainId:
 *                             type: string
 *                             example: "1"
 *                           userName:
 *                             type: string
 *                             example: "john_captain"
 *                           totalOrders:
 *                             type: integer
 *                             example: 25
 *                           totalEarnings:
 *                             type: number
 *                             format: float
 *                             example: 1250.50
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalOrdersSum:
 *                           type: integer
 *                           example: 150
 *                         totalEarningsSum:
 *                           type: number
 *                           format: float
 *                           example: 7500.25
 *                         avgOrdersPerCaptain:
 *                           type: number
 *                           format: float
 *                           example: 25.0
 *                         avgEarningsPerCaptain:
 *                           type: number
 *                           format: float
 *                           example: 1250.04
 *                     period:
 *                       type: object
 *                       properties:
 *                         startDate:
 *                           type: string
 *                           format: date
 *                           example: "2024-01-01"
 *                         endDate:
 *                           type: string
 *                           format: date
 *                           example: "2024-01-31"
 *                 message:
 *                   type: string
 *                   example: Captains statistics retrieved successfully
 */
router.get('/statistics/captains-overview', protectAdmin, adminController.getAllCaptainsStatistics);

/**
 * @swagger
 * /api/admin/vendors/{vendorId}/bulk-set-pricing:
 *   put:
 *     summary: Bulk set vendor neighborhood pricing
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - neighborhoodPrices
 *             properties:
 *               neighborhoodPrices:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - neighborhoodId
 *                     - price
 *                   properties:
 *                     neighborhoodId:
 *                       type: integer
 *                       minimum: 1
 *                       description: Neighborhood ID
 *                     price:
 *                       type: number
 *                       format: float
 *                       minimum: 0
 *                       description: Delivery price for this neighborhood
 *                 example:
 *                   - neighborhoodId: 1
 *                     price: 25.50
 *                   - neighborhoodId: 2
 *                     price: 30.00
 *     responses:
 *       200:
 *         description: Vendor neighborhood pricing updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       vendorId:
 *                         type: string
 *                         example: "1"
 *                       neighborhoodId:
 *                         type: string
 *                         example: "1"
 *                       price:
 *                         type: number
 *                         format: float
 *                         example: 25.50
 *                       neighborhood:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "1"
 *                           name:
 *                             type: string
 *                             example: "Downtown"
 *                 message:
 *                   type: string
 *                   example: Vendor neighborhood pricing updated successfully
 */
router.put('/vendors/:vendorId/bulk-set-pricing', protectAdmin, adminController.bulkSetVendorNeighborhoodPricing);

/**
 * @swagger
 * /api/admin/{id}/admin-counter-offer:
 *   put:
 *     summary: Admin counter offer for orders
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *               - price
 *             properties:
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Order description
 *               additionalNotes:
 *                 type: string
 *                 maxLength: 500
 *                 description: Additional notes (optional)
 *               price:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 description: Order price
 *               deliveryPrice:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 description: Delivery price (optional, admin can set this)
 *     responses:
 *       200:
 *         description: Admin counter offer submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *                 message:
 *                   type: string
 *                   example: Admin counter offer submitted successfully
 *       400:
 *         description: Order not found or cannot be modified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id/admin-counter-offer', protectAdmin, adminController.adminCounterOffer);

/**
 * @swagger
 * /api/admin/complaints:
 *   get:
 *     summary: Get all user complaints
 *     tags: [Admin]
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
 *         name: type
 *         schema:
 *           type: string
 *           enum: [USER, VENDOR, CAPTAIN]
 *         description: Filter by complaint type
 *     responses:
 *       200:
 *         description: User complaints retrieved successfully
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
 *                     complaints:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "1"
 *                           description:
 *                             type: string
 *                             example: "Service issue complaint"
 *                           type:
 *                             type: string
 *                             enum: [USER, VENDOR, CAPTAIN]
 *                             example: USER
 *                           submittedAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-15T10:30:00Z"
 *                           reply:
 *                             type: string
 *                             nullable: true
 *                             example: "We have reviewed your complaint..."
 *                           repliedAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             example: "2024-01-16T10:30:00Z"
 *                           user:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 example: "1"
 *                               userName:
 *                                 type: string
 *                                 example: "john_user"
 *                               email:
 *                                 type: string
 *                                 example: "john@example.com"
 *                               phoneNumber:
 *                                 type: string
 *                                 example: "+1234567890"
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *                 message:
 *                   type: string
 *                   example: User complaints retrieved successfully
 */
router.get('/complaints', protectAdmin, adminController.getAllUserComplaints);

/**
 * @swagger
 * /api/admin/complaints/{id}/reply:
 *   put:
 *     summary: Reply to user complaint
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Complaint ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reply
 *             properties:
 *               reply:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 1000
 *                 description: Admin reply to the complaint
 *     responses:
 *       200:
 *         description: Reply sent to user successfully
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
 *                     description:
 *                       type: string
 *                       example: "Service issue complaint"
 *                     type:
 *                       type: string
 *                       example: USER
 *                     reply:
 *                       type: string
 *                       example: "We have reviewed your complaint..."
 *                     repliedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-16T10:30:00Z"
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "1"
 *                         userName:
 *                           type: string
 *                           example: "john_user"
 *                 message:
 *                   type: string
 *                   example: Reply sent to user successfully
 */
router.put('/complaints/:id/reply', protectAdmin, adminController.replyToUserComplaint);

/**
 * @swagger
 * /api/admin/vendor-complaints:
 *   get:
 *     summary: Get all vendor complaints
 *     tags: [Admin]
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
 *         name: type
 *         schema:
 *           type: string
 *           enum: [USER, VENDOR, CAPTAIN]
 *         description: Filter by complaint type
 *     responses:
 *       200:
 *         description: Vendor complaints retrieved successfully
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
 *                     complains:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/VendorComplain'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *                 message:
 *                   type: string
 *                   example: Vendor complaints retrieved successfully
 */
router.get('/vendor-complaints', protectAdmin, adminController.getAllVendorComplaints);

/**
 * @swagger
 * /api/admin/vendor-complaints/{id}/reply:
 *   put:
 *     summary: Reply to vendor complaint
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Complaint ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reply
 *             properties:
 *               reply:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 1000
 *                 description: Admin reply to the complaint
 *     responses:
 *       200:
 *         description: Reply sent to vendor successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/VendorComplain'
 *                 message:
 *                   type: string
 *                   example: Reply sent to vendor successfully
 */
router.put('/vendor-complaints/:id/reply', protectAdmin, adminController.replyToVendorComplaint);

/**
 * @swagger
 * /api/admin/users/search:
 *   get:
 *     summary: Search users by username
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term for username
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
 *         description: User search results retrieved successfully
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
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "1"
 *                           userName:
 *                             type: string
 *                             example: "john_user"
 *                           email:
 *                             type: string
 *                             format: email
 *                             example: "john@example.com"
 *                           phoneNumber:
 *                             type: string
 *                             example: "+1234567890"
 *                           address:
 *                             type: string
 *                             example: "123 Main St, City"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-01T00:00:00Z"
 *                           neighborhood:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 example: "1"
 *                               name:
 *                                 type: string
 *                                 example: "Downtown"
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *                 message:
 *                   type: string
 *                   example: User search results retrieved successfully
 */
router.get('/users/search', protectAdmin, paginationValidation, adminController.searchUsers);

/**
 * @swagger
 * /api/admin/captains/search:
 *   get:
 *     summary: Search captains by username
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term for username
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
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "1"
 *                           userName:
 *                             type: string
 *                             example: "john_captain"
 *                           email:
 *                             type: string
 *                             format: email
 *                             example: "john@example.com"
 *                           phoneNumber:
 *                             type: string
 *                             example: "+1234567890"
 *                           longitude:
 *                             type: number
 *                             format: float
 *                             example: 31.2357
 *                           latitude:
 *                             type: number
 *                             format: float
 *                             example: 30.0444
 *                           workingHoursStart:
 *                             type: string
 *                             example: "09:00"
 *                           workingHoursEnd:
 *                             type: string
 *                             example: "17:00"
 *                           isAvailable:
 *                             type: boolean
 *                             example: true
 *                           isLocked:
 *                             type: boolean
 *                             example: false
 *                           lastActivated:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-15T10:30:00Z"
 *                           rating:
 *                             type: number
 *                             format: float
 *                             example: 4.5
 *                           ratingSum:
 *                             type: number
 *                             format: float
 *                             example: 45.0
 *                           ratingCount:
 *                             type: integer
 *                             example: 10
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-01T00:00:00Z"
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *                 message:
 *                   type: string
 *                   example: Captain search results retrieved successfully
 */
router.get('/captains/search', protectAdmin, paginationValidation, adminController.searchCaptains);

/**
 * @swagger
 * /api/admin/refresh-token:
 *   post:
 *     summary: Refresh admin access token
 *     tags: [Admin]
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
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The admin refresh token
 *     responses:
 *       200:
 *         description: Admin tokens refreshed successfully
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
 *                     admin:
 *                       $ref: '#/components/schemas/Admin'
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
router.post('/refresh-token', authController.adminRefreshToken);

/**
 * @swagger
 * /api/admin/categories:
 *   post:
 *     summary: Create a new category (Admin only)
 *     tags: [Admin]
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
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Category name
 *     responses:
 *       201:
 *         description: Category created successfully
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
 *                     name:
 *                       type: string
 *                     tenantId:
 *                       type: string
 *                 message:
 *                   type: string
 *                   example: Category created successfully
 */
router.post('/categories', protectAdmin, categoryController.createCategory);

/**
 * @swagger
 * /api/admin/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Admin]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       tenantId:
 *                         type: string
 *                 message:
 *                   type: string
 *                   example: Categories retrieved successfully
 */
router.get('/categories', protectAdmin, categoryController.getAllCategories);

/**
 * @swagger
 * /api/admin/categories/{id}:
 *   delete:
 *     summary: Delete a category (Admin only)
 *     tags: [Admin - Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
 */
router.delete('/categories/:id', protectAdmin, categoryController.deleteCategory);

/**
 * @swagger
 * /api/admin/categories/reorder:
 *   put:
 *     summary: Reorder categories (Admin only)
 *     tags: [Admin - Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderedIds
 *             properties:
 *               orderedIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Categories reordered successfully
 */
router.put('/categories/reorder', protectAdmin, categoryController.reorderCategories);

/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     summary: Get all orders with filters (Admin only)
 *     tags: [Admin]
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
 *           enum: [PENDING, COUNTER_OFFER_SENT, COUNTER_OFFER_ACCEPTED, ACCEPTED_BY_CAPTAIN, DELIVERED, CANCELLED, REJECTED_BY_VENDOR, FINALIZED]
 *         description: Filter by order status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering (YYYY-MM-DD)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
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
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           status:
 *                             type: string
 *                           description:
 *                             type: string
 *                           totalPrice:
 *                             type: number
 *                           deliveryPrice:
 *                             type: number
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           user:
 *                             type: object
 *                           vendor:
 *                             type: object
 *                           captain:
 *                             type: object
 *                           neighborhood:
 *                             type: object
 *                           attachments:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                 type:
 *                                   type: string
 *                                 link:
 *                                   type: string
 *                                 linkUrl:
 *                                   type: string
 *                                   description: Pre-signed URL for accessing the attachment
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
 *                   example: Orders retrieved successfully
 */
router.get('/orders', protectAdmin, paginationValidation, adminController.getAllOrders);

/**
 * @swagger
 * /api/admin/orders/{orderId}/delivery-price:
 *   put:
 *     summary: Change delivery price for special order (Admin only)
 *     tags: [Admin]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Special order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deliveryPrice
 *             properties:
 *               deliveryPrice:
 *                 type: number
 *                 description: New delivery price
 *                 example: 25.50
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Delivery price updated successfully
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
 *                   description: Updated order object with attachments
 *                 message:
 *                   type: string
 *                   example: Delivery price updated successfully
 *       400:
 *         description: Bad request or order not found
 */
router.put('/orders/:orderId/delivery-price', protectAdmin, adminController.changeDeliveryPrice);

/**
 * @swagger
 * /api/admin/captains/{id}/set-max-limits:
 *   put:
 *     summary: Set captain max limits (Admin only)
 *     tags: [Admin]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Captain ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               maxNumberOfOrders:
 *                 type: integer
 *                 description: Maximum number of concurrent orders
 *                 example: 5
 *               maxEarnings:
 *                 type: number
 *                 description: Maximum earnings since last activation
 *                 example: 500.00
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Captain limits updated successfully
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
 *                     maxCurrentOrders:
 *                       type: integer
 *                     currentNumberOfOrders:
 *                       type: integer
 *                     maxEarningsSinceLastActivation:
 *                       type: number
 *                     earningSinceLastActivation:
 *                       type: number
 *                 message:
 *                   type: string
 *                   example: Captain limits updated successfully
 *       400:
 *         description: Bad request or captain not found
 */
router.put('/captains/:id/set-max-limits', protectAdmin, adminController.setCaptainMaxLimits);
router.put('/vendors/:id/reset-password', protectAdmin, adminController.resetVendorPassword);

router.post('/orders/create-for-user', protectAdmin, adminController.createOrderForUser);
router.put('/orders/:orderId/release-captain', protectAdmin, adminController.releaseCaptain);
router.put('/orders/:orderId/assign-captain', protectAdmin, adminController.assignCaptain);

module.exports = router;