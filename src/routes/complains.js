const express = require('express');
const router = express.Router();
const complainController = require('../controllers/complainController');
const { protect } = require('../middlewares/auth');
const { complainValidation, paginationValidation } = require('../utils/validation');


/**
 * @swagger
 * /api/complains/{id}:
 *   get:
 *     summary: Get complaint by ID
 *     tags: [Complains]
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
 *     responses:
 *       200:
 *         description: Complaint retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Complain'
 *                 message:
 *                   type: string
 *                   example: Complain retrieved successfully
 */
router.get('/:id', complainController.getComplainById);


// Protected routes - require user authentication
router.use(protect);

/**
 * @swagger
 * /api/complains:
 *   post:
 *     summary: Create a new complaint
 *     tags: [Complains]
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
 *               - description
 *               - type
 *             properties:
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Complaint description
 *               type:
 *                 type: string
 *                 enum: [USER, VENDOR, CAPTAIN]
 *                 description: Source of complaint
 *     responses:
 *       201:
 *         description: Complaint created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Complain'
 *                 message:
 *                   type: string
 *                   example: Complain submitted successfully
 */
router.post('/', complainValidation.create, complainController.createComplain);

/**
 * @swagger
 * /api/complains:
 *   get:
 *     summary: Get user's complaints
 *     tags: [Complains]
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
 *         description: Complaints retrieved successfully
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
 *                         $ref: '#/components/schemas/Complain'
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
 *                   example: Complains retrieved successfully
 */
router.get('/', paginationValidation, complainController.getUserComplains);

/**
 * @swagger
 * /api/complains/{id}:
 *   delete:
 *     summary: Delete complaint
 *     tags: [Complains]
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
 *     responses:
 *       200:
 *         description: Complaint deleted successfully
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
 *                     message:
 *                       type: string
 *                       example: Complain deleted successfully
 *                 message:
 *                   type: string
 *                   example: Complain deleted successfully
 */
router.delete('/:id', complainController.deleteComplain);

module.exports = router; 