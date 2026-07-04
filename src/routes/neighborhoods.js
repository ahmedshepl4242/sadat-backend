const express = require('express');
const router = express.Router();
const neighborhoodController = require('../controllers/neighborhoodController');
const { protectAdmin } = require('../middlewares/auth');
const { neighborhoodValidation } = require('../utils/validation');

/**
 * @swagger
 * /api/neighborhoods:
 *   get:
 *     summary: Get all neighborhoods
 *     tags: [Neighborhoods]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *     responses:
 *       200:
 *         description: Neighborhoods retrieved successfully
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
 *                         $ref: '#/components/schemas/Neighborhood'
 *                 message:
 *                   type: string
 *                   example: Neighborhoods retrieved successfully
 */
router.get('/', neighborhoodController.getAllNeighborhoods);

/**
 * @swagger
 * /api/neighborhoods/{id}:
 *   get:
 *     summary: Get neighborhood by ID
 *     tags: [Neighborhoods]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Neighborhood ID
 *     responses:
 *       200:
 *         description: Neighborhood retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Neighborhood'
 *                 message:
 *                   type: string
 *                   example: Neighborhood retrieved successfully
 */
router.get('/:id', neighborhoodValidation.idParam, neighborhoodController.getNeighborhoodById);

/**
 * @swagger
 * /api/neighborhoods:
 *   post:
 *     summary: Create a new neighborhood
 *     tags: [Neighborhoods]
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
 *                 description: Neighborhood name
 *     responses:
 *       201:
 *         description: Neighborhood created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Neighborhood'
 *                 message:
 *                   type: string
 *                   example: Neighborhood created successfully
 */
router.post('/', protectAdmin, neighborhoodValidation.create, neighborhoodController.createNeighborhood);

/**
 * @swagger
 * /api/neighborhoods/{id}:
 *   put:
 *     summary: Update neighborhood
 *     tags: [Neighborhoods]
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
 *         description: Neighborhood ID
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
 *                 description: Neighborhood name
 *     responses:
 *       200:
 *         description: Neighborhood updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Neighborhood'
 *                 message:
 *                   type: string
 *                   example: Neighborhood updated successfully
 */
router.put('/:id', protectAdmin, neighborhoodValidation.idParam, neighborhoodValidation.update, neighborhoodController.updateNeighborhood);

/**
 * @swagger
 * /api/neighborhoods/{id}:
 *   delete:
 *     summary: Delete neighborhood
 *     tags: [Neighborhoods]
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
 *         description: Neighborhood ID
 *     responses:
 *       200:
 *         description: Neighborhood deleted successfully
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
 *                       example: Neighborhood deleted successfully
 *                 message:
 *                   type: string
 *                   example: Neighborhood deleted successfully
 */
router.delete('/:id', protectAdmin, neighborhoodValidation.idParam, neighborhoodController.deleteNeighborhood);

/**
 * @swagger
 * /api/neighborhoods/reorder:
 *   put:
 *     summary: Reorder neighborhoods (Admin only)
 *     tags: [Neighborhoods]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
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
 *         description: Neighborhoods reordered successfully
 */
router.put('/reorder', protectAdmin, neighborhoodController.reorderNeighborhoods);

module.exports = router;