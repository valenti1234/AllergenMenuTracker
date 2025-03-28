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
 *     GeneratedIngredient:
 *       type: object
 *       required:
 *         - name
 *         - quantity
 *         - unit
 *       properties:
 *         name:
 *           type: string
 *           description: Nome dell'ingrediente
 *         quantity:
 *           type: number
 *           description: Quantità dell'ingrediente
 *         unit:
 *           type: string
 *           description: Unità di misura (kg, g, l, ml, pz)
 *     RecipeMapping:
 *       type: object
 *       required:
 *         - menuItemId
 *         - ingredients
 *         - lastUpdated
 *         - isAutoGenerated
 *       properties:
 *         menuItemId:
 *           type: string
 *           description: ID del piatto nel menu
 *         ingredients:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/GeneratedIngredient'
 *           description: Lista degli ingredienti necessari
 *         lastUpdated:
 *           type: string
 *           format: date-time
 *           description: Data dell'ultimo aggiornamento
 *         isAutoGenerated:
 *           type: boolean
 *           description: Indica se la mappatura è stata generata automaticamente
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
 *   - name: Recipe Mappings
 *     description: Recipe mapping operations
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

/**
 * @swagger
 * /recipe-mappings:
 *   get:
 *     summary: Ottieni tutte le mappature delle ricette
 *     tags: [Recipe Mappings]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista di tutte le mappature
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RecipeMapping'
 *       401:
 *         description: Non autorizzato
 *       500:
 *         description: Errore del server
 * 
 * @swagger
 * /recipe-mappings/{menuItemId}:
 *   get:
 *     summary: Ottieni la mappatura per un piatto specifico
 *     tags: [Recipe Mappings]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: menuItemId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del piatto nel menu
 *     responses:
 *       200:
 *         description: Mappatura trovata
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RecipeMapping'
 *       404:
 *         description: Mappatura non trovata
 *       500:
 *         description: Errore del server
 * 
 *   put:
 *     summary: Crea o aggiorna manualmente una mappatura
 *     tags: [Recipe Mappings]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: menuItemId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del piatto nel menu
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ingredients
 *             properties:
 *               ingredients:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/GeneratedIngredient'
 *     responses:
 *       200:
 *         description: Mappatura aggiornata con successo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RecipeMapping'
 *       404:
 *         description: Piatto non trovato
 *       500:
 *         description: Errore del server
 * 
 * @swagger
 * /recipe-mappings/{menuItemId}/generate:
 *   post:
 *     summary: Genera automaticamente una mappatura usando OpenAI
 *     tags: [Recipe Mappings]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: menuItemId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del piatto nel menu
 *     responses:
 *       200:
 *         description: Mappatura generata con successo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RecipeMapping'
 *       404:
 *         description: Piatto non trovato
 *       500:
 *         description: Errore del server
 * 
 * @swagger
 * /recipe-mappings/{menuItemId}:
 *   delete:
 *     summary: Elimina una mappatura
 *     tags: [Recipe Mappings]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: menuItemId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del piatto nel menu
 *     responses:
 *       200:
 *         description: Mappatura eliminata con successo
 *       404:
 *         description: Mappatura non trovata
 *       500:
 *         description: Errore del server
 * 
 * @swagger
 * /recipe-mappings/generate-all:
 *   post:
 *     summary: Genera mappature per tutti i piatti senza mappatura
 *     tags: [Recipe Mappings]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Risultato della generazione in massa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Riepilogo delle operazioni
 *                 totalProcessed:
 *                   type: number
 *                   description: Numero totale di piatti processati
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       menuItemId:
 *                         type: string
 *                       status:
 *                         type: string
 *                       error:
 *                         type: string
 *       500:
 *         description: Errore del server
 */ 