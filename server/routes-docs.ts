/**
 * @swagger
 * components:
 *   schemas:
 *     MenuItem:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - category
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the menu item
 *         name:
 *           type: object
 *           properties:
 *             en:
 *               type: string
 *               description: English name
 *             it:
 *               type: string
 *               description: Italian name
 *             es:
 *               type: string
 *               description: Spanish name
 *         description:
 *           type: object
 *           properties:
 *             en:
 *               type: string
 *               description: English description
 *             it:
 *               type: string
 *               description: Italian description
 *             es:
 *               type: string
 *               description: Spanish description
 *         price:
 *           type: number
 *           description: The price in cents
 *         category:
 *           type: string
 *           description: The category of the menu item
 *         image:
 *           type: string
 *           description: URL to the image
 *         allergens:
 *           type: array
 *           items:
 *             type: string
 *           description: List of allergens
 *         dietaryInfo:
 *           type: object
 *           properties:
 *             vegetarian:
 *               type: boolean
 *             vegan:
 *               type: boolean
 *             glutenFree:
 *               type: boolean
 *             dairyFree:
 *               type: boolean
 *         nutritionalInfo:
 *           type: object
 *           properties:
 *             calories:
 *               type: number
 *             protein:
 *               type: number
 *             carbs:
 *               type: number
 *             fat:
 *               type: number
 *     Order:
 *       type: object
 *       required:
 *         - type
 *         - items
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the order
 *         type:
 *           type: string
 *           enum: [dine-in, takeaway, delivery]
 *           description: Order type
 *         status:
 *           type: string
 *           enum: [pending, preparing, ready, completed, cancelled]
 *           description: Order status
 *         phoneNumber:
 *           type: string
 *           description: Customer phone number
 *         tableNumber:
 *           type: string
 *           description: Table number for dine-in orders
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               menuItemId:
 *                 type: string
 *               quantity:
 *                 type: number
 *               price:
 *                 type: number
 *               name:
 *                 type: string
 *         total:
 *           type: number
 *           description: Total price in cents
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - password
 *         - role
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the user
 *         username:
 *           type: string
 *           description: Username for login
 *         role:
 *           type: string
 *           enum: [admin, manager, kitchen, staff]
 *           description: User role
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * tags:
 *   - name: Menu
 *     description: Menu item operations
 *   - name: Orders
 *     description: Order operations
 *   - name: Users
 *     description: User operations
 *   - name: Admin
 *     description: Admin operations
 *   - name: Metrics
 *     description: Dashboard metrics
 */

/**
 * @swagger
 * /menu:
 *   get:
 *     summary: Get all menu items
 *     tags: [Menu]
 *     responses:
 *       200:
 *         description: List of menu items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MenuItem'
 */

/**
 * @swagger
 * /menu/{id}:
 *   get:
 *     summary: Get a menu item by ID
 *     tags: [Menu]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the menu item
 *     responses:
 *       200:
 *         description: Menu item details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MenuItem'
 *       404:
 *         description: Menu item not found
 */

/**
 * @swagger
 * /orders/track/{phoneNumber}:
 *   get:
 *     summary: Track orders by phone number
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: phoneNumber
 *         schema:
 *           type: string
 *         required: true
 *         description: Customer phone number
 *     responses:
 *       200:
 *         description: List of orders for the phone number
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of all orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Order'
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /admin/metrics/overview:
 *   get:
 *     summary: Get overview metrics for dashboard
 *     tags: [Metrics]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Overview metrics
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /admin/metrics/orders:
 *   get:
 *     summary: Get order metrics
 *     tags: [Metrics]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Order metrics
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /admin/metrics/revenue:
 *   get:
 *     summary: Get revenue metrics
 *     tags: [Metrics]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Revenue metrics
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /admin/metrics/dietary:
 *   get:
 *     summary: Get dietary preference metrics
 *     tags: [Metrics]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Dietary preference metrics
 *       401:
 *         description: Unauthorized
 */ 