const express = require('express');
const router = express.Router();
const captainRequestController = require('../controllers/captainRequestController');
const { protectCaptain } = require('../middlewares/auth');
const { captainRequestValidation, paginationValidation } = require('../utils/validation');

/**
 * @swagger
 * /api/captain-requests:
 *   post:
 *     summary: Submit a new request (Captain only)
 *     tags: [Captain Requests]
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
 *             properties:
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *                 description: Description of the request
 *     responses:
 *       201:
 *         description: Request submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CaptainRequest'
 *                 message:
 *                   type: string
 *                   example: Request submitted successfully
 */
router.post('/', protectCaptain, captainRequestValidation.submitRequest, captainRequestController.submitRequest);

/**
 * @swagger
 * /api/captain-requests:
 *   get:
 *     summary: Get captain's own requests
 *     tags: [Captain Requests]
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
 *         description: Requests retrieved successfully
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
 *                     requests:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CaptainRequest'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *                 message:
 *                   type: string
 *                   example: Requests retrieved successfully
 */
router.get('/', protectCaptain, paginationValidation, captainRequestController.getCaptainRequests);


/**
 * @swagger
 * /api/captain-requests/{id}:
 *   get:
 *     summary: Get request by ID
 *     tags: [Captain Requests]
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
 *     responses:
 *       200:
 *         description: Request retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CaptainRequest'
 *                 message:
 *                   type: string
 *                   example: Request retrieved successfully
 */
router.get('/:id', captainRequestValidation.idParam, captainRequestController.getRequestById);



/**
 * @swagger
 * /api/captain-requests/{id}:
 *   delete:
 *     summary: Delete a pending request (Captain only)
 *     tags: [Captain Requests]
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
 *     responses:
 *       200:
 *         description: Request deleted successfully
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
 *                       example: Request deleted successfully
 *                 message:
 *                   type: string
 *                   example: Request deleted successfully
 */
router.delete('/:id', protectCaptain, captainRequestValidation.idParam, captainRequestController.deleteRequest);

module.exports = router; 