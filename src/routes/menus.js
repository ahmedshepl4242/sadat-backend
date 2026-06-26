const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const menuController = require('../controllers/menuController');
const { protectVendor } = require('../middlewares/auth');
const { menuValidation, paginationValidation } = require('../utils/validation');

/**
 * @swagger
 * /api/menus:
 *   post:
 *     summary: Create a new menu item
 *     tags: [Menus]
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
 *             required:
 *               - photo
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: photo
 *     responses:
 *       201:
 *         description: Menu item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Menu'
 *                 message:
 *                   type: string
 *                   example: Menu item created successfully
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', protectVendor, upload.single('photo'), menuValidation.create, menuController.createMenu);

/**
 * @swagger
 * /api/menus:
 *   get:
 *     summary: Get vendor's menu items
 *     tags: [Menus]
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
 *         description: Menu items retrieved successfully
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
 *                     menus:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Menu'
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
 *                   example: Menu items retrieved successfully
 */
router.get('/', protectVendor, paginationValidation, menuController.getVendorMenus);



/**
 * @swagger
 * /api/menus/stats:
 *   get:
 *     summary: Get menu statistics
 *     tags: [Menus]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Menu statistics retrieved successfully
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
 *                     totalMenus:
 *                       type: integer
 *                 message:
 *                   type: string
 *                   example: Menu statistics retrieved successfully
 */
// router.get('/stats', protectVendor, menuController.getMenuStats);

/**
 * @swagger
 * /api/menus/{id}:
 *   get:
 *     summary: Get menu item by ID
 *     tags: [Menus]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Menu item ID
 *     responses:
 *       200:
 *         description: Menu item retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Menu'
 *                 message:
 *                   type: string
 *                   example: Menu item retrieved successfully
 *       404:
 *         description: Menu item not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', menuValidation.idParam, menuController.getMenuById);

/**
 * @swagger
 * /api/menus/{id}:
 *   put:
 *     summary: Update menu item
 *     tags: [Menus]
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
 *         description: Menu item ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - photo
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: photo
 *     responses:
 *       200:
 *         description: Menu item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Menu'
 *                 message:
 *                   type: string
 *                   example: Menu item updated successfully
 *       400:
 *         description: Validation error or access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', protectVendor, upload.single('photo'), menuValidation.idParam, menuController.updateMenu);

/**
 * @swagger
 * /api/menus/{id}:
 *   delete:
 *     summary: Delete menu item
 *     tags: [Menus]
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
 *         description: Menu item ID
 *     responses:
 *       200:
 *         description: Menu item deleted successfully
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
 *                       example: Menu item deleted successfully
 *                 message:
 *                   type: string
 *                   example: Menu item deleted successfully
 *       400:
 *         description: Menu item not found or access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', protectVendor, menuValidation.idParam, menuController.deleteMenu);

/**
 * @swagger
 * /api/menus/vendor/{vendorId}:
 *   get:
 *     summary: Get public vendor menu (for customers)
 *     tags: [Menus]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
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
 *         description: Vendor menu retrieved successfully
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
 *                     menus:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Menu'
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
 *                   example: Vendor menu retrieved successfully
 */
router.get('/vendor/:vendorId', paginationValidation, menuController.getPublicVendorMenus);

module.exports = router; 