const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories (Public)
 *     tags: [Categories]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
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
router.get('/', categoryController.getAllCategories);

module.exports = router;
