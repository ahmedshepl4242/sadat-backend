const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, protectVendor, protectCaptain, protectAdmin } = require('../middlewares/auth');
const { orderValidation, paginationValidation } = require('../utils/validation');

/**
 * @swagger
 * /api/orders/available:
 *   get:
 *     summary: Get available orders for captains
 *     tags: [Orders]
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
 *         description: Available orders retrieved successfully
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
 *                   example: Available orders retrieved successfully
 */
router.get('/available', paginationValidation, orderController.getAvailableOrders);

/**
 * @swagger
 * /api/orders/resend-pending-notifications:
 *   post:
 *     summary: Re-send captain notifications for all orders still waiting for a captain
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *     responses:
 *       200:
 *         description: Notifications resent successfully
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
 *                     notifiedOrders:
 *                       type: integer
 *                 message:
 *                   type: string
 *                   example: Notifications resent successfully
 */
router.post('/resend-pending-notifications', protectAdmin, orderController.resendPendingOrderNotifications);

/**
 * @swagger
 * /api/orders/stats:
 *   get:
 *     summary: Get order statistics
 *     tags: [Orders]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *     responses:
 *       200:
 *         description: Order statistics retrieved successfully
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
 *                     pendingOrders:
 *                       type: integer
 *                     inDeliveryOrders:
 *                       type: integer
 *                     deliveredOrders:
 *                       type: integer
 *                     cancelledOrders:
 *                       type: integer
 *                     completionRate:
 *                       type: string
 *                 message:
 *                   type: string
 *                   example: Order statistics retrieved successfully
 */
// router.get('/stats', orderController.getOrderStats);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order retrieved successfully
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
 *                   example: Order retrieved successfully
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', orderValidation.idParam, orderController.getOrderById);

/**
 * @swagger
 * /api/orders/create-by-user:
 *   post:
 *     summary: Create order by user
 *     tags: [Orders]
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
 *               - vendorId
 *               - userAddress
 *               - phoneNumber
 *               - neighborhoodId
 *             properties:
 *               vendorId:
 *                 type: integer
 *                 minimum: 1
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               additionalNotes:
 *                 type: string
 *                 maxLength: 500
 *               userAddress:
 *                 type: string
 *                 maxLength: 200
 *               phoneNumber:   
 *                 type: string
 *                 maxLength: 20
 *               userLatitude:
 *                 type: number
 *               userLongitude:
 *                 type: number
 *               neighborhoodId:
 *                 type: integer
 *                 minimum: 1
 *               attachments:
 *                 type: array
 *                 description: Order attachments (voice notes or images)
 *                 items:
 *                   type: object
 *                   required:
 *                     - type
 *                     - link
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [VOICE, IMAGE]
 *                       description: Attachment type
 *                     link:
 *                       type: string
 *                       description: URL/link to the attachment
 *     responses:
 *       201:
 *         description: Order created successfully
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
 *                   example: Order created successfully
 *       400:
 *         description: Validation error or vendor not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/create-by-user', protect, orderValidation.createByUser, orderController.createByUser);

/**
 * @swagger
 * /api/orders/user/orders:
 *   get:
 *     summary: Get user orders
 *     tags: [Orders]
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
router.get('/user/orders', protect, paginationValidation, orderController.getByUser);

/**
 * @swagger
 * /api/orders/{id}/user-approve:
 *   put:
 *     summary: User approve order
 *     tags: [Orders]
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
 *     responses:
 *       200:
 *         description: Order approved successfully
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
 *                   example: Order approved successfully
 *       400:
 *         description: Order not found or cannot be approved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id/user-approve', protect, orderValidation.idParam, orderController.userApprove);

/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     summary: Delete order (user only)
 *     tags: [Orders]
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
 *     responses:
 *       200:
 *         description: Order deleted successfully
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
 *                       example: Order deleted successfully
 *                 message:
 *                   type: string
 *                   example: Order deleted successfully
 *       400:
 *         description: Order not found or cannot be deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', protect, orderValidation.idParam, orderController.deleteOrder);

/**
 * @swagger
 * /api/orders/create-by-vendor:
 *   post:
 *     summary: Create order by vendor
 *     tags: [Orders]
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
 *               - userId
 *               - userAddress
 *               - phoneNumber
 *               - neighborhoodId
 *             properties:
 *               userId:
 *                 type: integer
 *                 minimum: 1
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               additionalNotes:
 *                 type: string
 *                 maxLength: 500
 *               userAddress:
 *                 type: string
 *                 maxLength: 200
 *               phoneNumber:
 *                 type: string
 *                 maxLength: 20
 *               neighborhoodId:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       201:
 *         description: Order created successfully
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
 *                   example: Order created successfully
 *       400:
 *         description: Validation error or user not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/create-by-vendor', protectVendor, orderValidation.createByVendor, orderController.createByVendor);

/**
 * @swagger
 * /api/orders/vendor/orders:
 *   get:
 *     summary: Get vendor orders
 *     tags: [Orders]
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
 *                   example: Orders retrieved successfully
 */
router.get('/vendor/orders', protectVendor, paginationValidation, orderController.getByVendor);

/**
 * @swagger
 * /api/orders/{id}/vendor-counter-offer:
 *   put:
 *     summary: Vendor accept order (directly approved, notifies user and captains)
 *     description: Vendor accepts the order with price details. Order is immediately moved to COUNTER_OFFER_ACCEPTED status. User is notified about acceptance with price, and all available captains are notified about new delivery.
 *     tags: [Orders]
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
 *                 description: Final order description
 *               additionalNotes:
 *                 type: string
 *                 maxLength: 500
 *                 description: Additional notes for the order
 *               price:
 *                 type: number
 *                 description: Final order price
 *                 example: 150.00
 *     responses:
 *       200:
 *         description: Order accepted successfully, user and captains notified
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
 *                   example: Counter offer submitted successfully
 *       400:
 *         description: Order not found or cannot be modified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id/vendor-counter-offer', protectVendor, orderValidation.idParam, orderValidation.vendorCounterOffer, orderController.vendorCounterOffer);

/**
 * @swagger
 * /api/orders/{id}/vendor-accept:
 *   put:
 *     summary: Vendor accept order as-is (using the order's existing price)
 *     tags: [Orders]
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
 *     responses:
 *       200:
 *         description: Order accepted successfully
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
 *                   example: Order accepted successfully
 *       400:
 *         description: Order not found or cannot be accepted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id/vendor-accept', protectVendor, orderValidation.idParam, orderController.vendorAccept);

/**
 * @swagger
 * /api/orders/{id}/vendor-reject:
 *   put:
 *     summary: Vendor reject order
 *     tags: [Orders]
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
 *     responses:
 *       200:
 *         description: Order rejected successfully
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
 *                   example: Order rejected successfully
 *       400:
 *         description: Order not found or cannot be rejected
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id/vendor-reject', protectVendor, orderValidation.idParam, orderController.vendorReject);

/**
 * @swagger
 * /api/orders/captain/orders:
 *   get:
 *     summary: Get captain orders
 *     tags: [Orders]
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
 *                   example: Orders retrieved successfully
 */
router.get('/captain/orders', protectCaptain, paginationValidation, orderController.getByCaptain);

/**
 * @swagger
 * /api/orders/{id}/captain-approve:
 *   put:
 *     summary: Captain accept order (with delivery price for special orders)
 *     description: Captain accepts an order. For special orders (vendor_id == -1), deliveryPrice must be provided in the request body.
 *     tags: [Orders]
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
 *       required: false
 *       description: For special orders (vendor_id == -1), deliveryPrice is required
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deliveryPrice:
 *                 type: number
 *                 description: Delivery price set by captain (required for special orders)
 *                 example: 30.00
 *     responses:
 *       200:
 *         description: Order accepted successfully
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
 *                   example: Order accepted successfully
 *       400:
 *         description: Order not found, not available for pickup, or deliveryPrice missing for special order
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id/captain-approve', protectCaptain, orderValidation.idParam, orderController.captainApprove);

// /**
//  * @swagger
//  * /api/orders/{id}/start-delivery:
//  *   put:
//  *     summary: Start delivery
//  *     tags: [Orders]
//  *     security:
//  *       - BearerAuth: []
//  *     parameters:
//  *       - $ref: '#/components/parameters/TenantId'
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: integer
//  *           minimum: 1
//  *         description: Order ID
//  *     responses:
//  *       200:
//  *         description: Delivery started successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: true
//  *                 data:
//  *                   $ref: '#/components/schemas/Order'
//  *                 message:
//  *                   type: string
//  *                   example: Delivery started successfully
//  *       400:
//  *         description: Order not found or cannot start delivery
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/Error'
//  */
// router.put('/:id/start-delivery', protectCaptain, orderValidation.idParam, orderController.startDelivery);

/**
 * @swagger
 * /api/orders/{id}/arrived:
 *   put:
 *     summary: Captain arrived at user location
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: User notified about captain arrival
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
 *                     success:
 *                       type: boolean
 *                     message:
 *                       type: string
 *                     orderId:
 *                       type: string
 *                 message:
 *                   type: string
 *                   example: User notified about captain arrival
 */
router.put('/:id/arrived', protectCaptain, orderValidation.idParam, orderController.captainArrived);

/**
 * @swagger
 * /api/orders/{id}/finalize:
 *   put:
 *     summary: Mark order as delivered
 *     tags: [Orders]
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
 *     responses:
 *       200:
 *         description: Order delivered successfully
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
 *                   example: Order delivered successfully
 *       400:
 *         description: Order not found or cannot be finalized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// User finalize order (confirm delivery)
// router.put('/:id/finalize', protect, orderValidation.idParam, orderController.finalize);

/**
 * @swagger
 * /api/orders/{id}/delivered:
 *   put:
 *     summary: Mark order as delivered (Captain)
 *     tags: [Orders]
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
 *     responses:
 *       200:
 *         description: Order marked as delivered successfully
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
 *                   example: Order marked as delivered successfully
 *       400:
 *         description: Order not found or cannot be marked as delivered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id/delivered', protectCaptain, orderValidation.idParam, orderController.markDelivered);

/**
 * @swagger
 * /api/orders/{id}/rate:
 *   put:
 *     summary: Rate captain after order delivery (User)
 *     tags: [Orders]
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
 *               - rating
 *             properties:
 *               rating:
 *                 type: number
 *                 format: float
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 to 5
 *     responses:
 *       200:
 *         description: Captain rated successfully
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
 *                     phoneNumber:
 *                       type: string
 *                       example: "+1234567890"
 *                     ratingSum:
 *                       type: number
 *                       format: float
 *                       example: 45.0
 *                     ratingCount:
 *                       type: integer
 *                       example: 10
 *                     currentRating:
 *                       type: number
 *                       format: float
 *                       example: 4.5
 *                 message:
 *                   type: string
 *                   example: Captain rated successfully
 *       400:
 *         description: Order not found or cannot be rated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id/rate', protect, orderValidation.idParam, orderValidation.rateOrder, orderController.rateCaptain);

module.exports = router; 