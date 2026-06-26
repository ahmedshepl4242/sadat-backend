const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { adminValidation } = require('../utils/validation');

/**
 * @swagger
 * /api/admin-signup/signup:
 *   post:
 *     summary: Admin registration (without tenant extraction)
 *     tags: [Admin Signup]
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
 *               - tenantId
 *               - neighborhood_name
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
 *               tenantId:
 *                 type: string
 *                 description: Tenant ID for the admin
 *               neighborhood_name:
 *                 type: string
 *                 description: Name of the neighborhood to create for this tenant
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
 *                     neighborhood:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         tenantId:
 *                           type: string
 *                     systemVendor:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "-1"
 *                         vendorName:
 *                           type: string
 *                           example: "System Vendor"
 *                         tenantId:
 *                           type: string
 *                         token:
 *                           type: string
 *                           description: JWT token for system vendor
 *                     token:
 *                       type: string
 *                       description: JWT authentication token
 *                     refreshToken:
 *                       type: string
 *                       description: JWT refresh token
 *                 message:
 *                   type: string
 *                   example: Admin registered successfully
 */
router.post('/signup', adminValidation.signup, authController.adminSignup);

module.exports = router;