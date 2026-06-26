const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const itemController = require('../controllers/itemController');
const { protectVendor } = require('../middlewares/auth');
const { paginationValidation } = require('../utils/validation');

/**
 * @swagger
 * tags:
 *   name: Items
 *   description: Item management endpoints
 */

/**
 * @swagger
 * /api/items:
 *   post:
 *     summary: Create a new item (Vendor only)
 *     tags: [Items]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - photo
 *             properties:
 *               name:
 *                 type: string
 *                 description: Item name
 *                 example: Pizza Margherita
 *               description:
 *                 type: string
 *                 description: Item description
 *                 example: Classic pizza with tomato and mozzarella
 *               price:
 *                 type: number
 *                 description: Item price
 *                 example: 50.00
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: Item image file
 *     responses:
 *       201:
 *         description: Item created successfully
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
 *                     description:
 *                       type: string
 *                     price:
 *                       type: number
 *                     imageLink:
 *                       type: string
 *                     imageUrl:
 *                       type: string
 *                       description: Pre-signed URL for image
 *                     isAvailable:
 *                       type: boolean
 *                     vendorId:
 *                       type: string
 *                 message:
 *                   type: string
 *                   example: Item created successfully
 *       400:
 *         description: Bad request
 */
router.post('/', protectVendor, upload.single('photo'), itemController.createItem);

/**
 * @swagger
 * /api/items/{itemId}:
 *   put:
 *     summary: Update an item (Vendor only)
 *     tags: [Items]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Item ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Item name
 *                 example: Pizza Margherita
 *               description:
 *                 type: string
 *                 description: Item description
 *                 example: Classic pizza with tomato and mozzarella
 *               price:
 *                 type: number
 *                 description: Item price
 *                 example: 55.00
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: Item image file (optional - only if updating image)
 *               isAvailable:
 *                 type: boolean
 *                 description: Item availability status
 *                 example: true
 *     responses:
 *       200:
 *         description: Item updated successfully
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
 *                     description:
 *                       type: string
 *                     price:
 *                       type: number
 *                     imageLink:
 *                       type: string
 *                     imageUrl:
 *                       type: string
 *                       description: Pre-signed URL for image
 *                     isAvailable:
 *                       type: boolean
 *                     vendorId:
 *                       type: string
 *                 message:
 *                   type: string
 *                   example: Item updated successfully
 *       400:
 *         description: Bad request or item not found
 */
router.put('/:itemId', protectVendor, upload.single('photo'), itemController.updateItem);

/**
 * @swagger
 * /api/items/{itemId}:
 *   delete:
 *     summary: Delete an item (Vendor only)
 *     tags: [Items]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Item ID
 *     responses:
 *       200:
 *         description: Item deleted successfully
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
 *                       example: Item deleted successfully
 *                 message:
 *                   type: string
 *                   example: Item deleted successfully
 *       400:
 *         description: Bad request or item not found
 */
router.delete('/:itemId', protectVendor, itemController.deleteItem);

/**
 * @swagger
 * /api/items/vendors/{vendorId}:
 *   get:
 *     summary: Get items by vendor (Public)
 *     tags: [Items]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - in: path
 *         name: vendorId
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
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Items retrieved successfully
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
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *                           price:
 *                             type: number
 *                           imageLink:
 *                             type: string
 *                           imageUrl:
 *                             type: string
 *                             description: Pre-signed URL for image
 *                           isAvailable:
 *                             type: boolean
 *                           vendorId:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
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
 *                   example: Items retrieved successfully
 *       400:
 *         description: Bad request
 */
router.get('/vendors/:vendorId', paginationValidation, itemController.getItemsByVendor);

module.exports = router;
