import { MenuItem, InsertMenuItem, User, InsertUser, Order, InsertOrder, OrderStatus } from "@shared/schema";
import { MenuItemModel, UserModel, OrderModel } from "./db";
import bcrypt from "bcryptjs";

export interface IStorage {
  // Menu Items
  getMenuItems(): Promise<MenuItem[]>;
  getMenuItem(id: string): Promise<MenuItem | undefined>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: string, item: Partial<InsertMenuItem>): Promise<MenuItem>;
  deleteMenuItem(id: string): Promise<void>;

  // Users
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;

  // Orders
  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<Order>): Promise<Order>;
  deleteOrder(id: string): Promise<void>;
  getOrdersByStatus(status: OrderStatus): Promise<Order[]>;
  getOrdersByPhoneNumber(phoneNumber: string): Promise<Order[]>;
}

export class MongoStorage implements IStorage {
  // Existing MenuItem methods...
  async getMenuItems(): Promise<MenuItem[]> {
    const items = await MenuItemModel.find();
    return items.map(item => ({
      id: item._id.toString(),
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      imageUrl: item.imageUrl,
      allergens: item.allergens,
      prepTime: item.prepTime,
      available: item.available,
      ingredients: item.ingredients || [],
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      dietaryInfo: item.dietaryInfo || [],
    }));
  }

  async getMenuItem(id: string): Promise<MenuItem | undefined> {
    const item = await MenuItemModel.findById(id);
    if (!item) return undefined;

    return {
      id: item._id.toString(),
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      imageUrl: item.imageUrl,
      allergens: item.allergens,
      prepTime: item.prepTime,
      available: item.available,
      ingredients: item.ingredients || [],
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      dietaryInfo: item.dietaryInfo || [],
    };
  }

  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    const newItem = await MenuItemModel.create(item);
    return {
      id: newItem._id.toString(),
      name: newItem.name,
      description: newItem.description,
      price: newItem.price,
      category: newItem.category,
      imageUrl: newItem.imageUrl,
      allergens: newItem.allergens,
      prepTime: newItem.prepTime,
      available: newItem.available,
      ingredients: newItem.ingredients || [],
      calories: newItem.calories,
      protein: newItem.protein,
      carbs: newItem.carbs,
      fat: newItem.fat,
    };
  }

  async updateMenuItem(id: string, item: Partial<InsertMenuItem>): Promise<MenuItem> {
    const updatedItem = await MenuItemModel.findByIdAndUpdate(
      id,
      { $set: item },
      { new: true }
    );

    if (!updatedItem) {
      throw new Error(`Menu item ${id} not found`);
    }

    return {
      id: updatedItem._id.toString(),
      name: updatedItem.name,
      description: updatedItem.description,
      price: updatedItem.price,
      category: updatedItem.category,
      imageUrl: updatedItem.imageUrl,
      allergens: updatedItem.allergens,
      prepTime: updatedItem.prepTime,
      available: updatedItem.available,
      ingredients: updatedItem.ingredients || [],
      calories: updatedItem.calories,
      protein: updatedItem.protein,
      carbs: updatedItem.carbs,
      fat: updatedItem.fat,
      dietaryInfo: updatedItem.dietaryInfo || [],
    };
  }

  async deleteMenuItem(id: string): Promise<void> {
    const result = await MenuItemModel.findByIdAndDelete(id);
    if (!result) {
      throw new Error(`Menu item ${id} not found`);
    }
  }

  // User methods
  async getUsers(): Promise<User[]> {
    const users = await UserModel.find();
    return users.map(user => ({
      id: user._id.toString(),
      username: user.username,
      password: user.password,
      role: user.role,
      name: user.name,
      email: user.email,
      active: user.active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }

  async getUser(id: string): Promise<User | undefined> {
    const user = await UserModel.findById(id);
    if (!user) return undefined;

    return {
      id: user._id.toString(),
      username: user.username,
      password: user.password,
      role: user.role,
      name: user.name,
      email: user.email,
      active: user.active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ username });
    if (!user) return undefined;

    return {
      id: user._id.toString(),
      username: user.username,
      password: user.password,
      role: user.role,
      name: user.name,
      email: user.email,
      active: user.active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async createUser(user: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const newUser = await UserModel.create({
      ...user,
      password: hashedPassword,
    });

    return {
      id: newUser._id.toString(),
      username: newUser.username,
      password: newUser.password,
      role: newUser.role,
      name: newUser.name,
      email: newUser.email,
      active: newUser.active,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User> {
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      { $set: userData },
      { new: true }
    );

    if (!updatedUser) {
      throw new Error(`User ${id} not found`);
    }

    return {
      id: updatedUser._id.toString(),
      username: updatedUser.username,
      password: updatedUser.password,
      role: updatedUser.role,
      name: updatedUser.name,
      email: updatedUser.email,
      active: updatedUser.active,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }

  async deleteUser(id: string): Promise<void> {
    const result = await UserModel.findByIdAndDelete(id);
    if (!result) {
      throw new Error(`User ${id} not found`);
    }
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    const orders = await OrderModel.find().sort({ createdAt: -1 });
    return orders.map(order => ({
      id: order._id.toString(),
      type: order.type,
      status: order.status,
      phoneNumber: order.phoneNumber,
      customerName: order.customerName,
      tableNumber: order.tableNumber,
      items: order.items.map(item => ({
        id: item._id.toString(),
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        specialInstructions: item.specialInstructions,
      })),
      specialInstructions: order.specialInstructions,
      total: order.total,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const order = await OrderModel.findById(id);
    if (!order) return undefined;

    return {
      id: order._id.toString(),
      type: order.type,
      status: order.status,
      phoneNumber: order.phoneNumber,
      customerName: order.customerName,
      tableNumber: order.tableNumber,
      items: order.items.map(item => ({
        id: item._id.toString(),
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        specialInstructions: item.specialInstructions,
      })),
      specialInstructions: order.specialInstructions,
      total: order.total,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  async createOrder(orderData: InsertOrder): Promise<Order> {
    try {
      // Calculate total based on menu items
      const menuItems = await Promise.all(
        orderData.items.map(async item => {
          const menuItem = await MenuItemModel.findById(item.menuItemId);
          if (!menuItem) {
            throw new Error(`Menu item ${item.menuItemId} not found`);
          }
          return menuItem;
        })
      );

      const items = orderData.items.map((item, index) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: menuItems[index]?.price || 0,
        name: menuItems[index]?.name || 'Unknown Item',
        specialInstructions: item.specialInstructions,
      }));

      const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const order = await OrderModel.create({
        ...orderData,
        items,
        total,
        status: orderData.status || "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return {
        id: order._id.toString(),
        type: order.type,
        status: order.status,
        phoneNumber: order.phoneNumber,
        customerName: order.customerName,
        tableNumber: order.tableNumber,
        items: order.items.map(item => ({
          id: item._id.toString(),
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
          specialInstructions: item.specialInstructions,
        })),
        specialInstructions: order.specialInstructions,
        total: order.total,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };
    } catch (error) {
      console.error('Order creation error:', error);
      throw new Error(`Failed to create order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateOrder(id: string, orderData: Partial<Order>): Promise<Order> {
    const order = await OrderModel.findByIdAndUpdate(
      id,
      { $set: orderData },
      { new: true }
    );

    if (!order) {
      throw new Error(`Order ${id} not found`);
    }

    return {
      id: order._id.toString(),
      type: order.type,
      status: order.status,
      phoneNumber: order.phoneNumber,
      customerName: order.customerName,
      tableNumber: order.tableNumber,
      items: order.items.map(item => ({
        id: item._id.toString(),
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        specialInstructions: item.specialInstructions,
      })),
      specialInstructions: order.specialInstructions,
      total: order.total,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  async deleteOrder(id: string): Promise<void> {
    const result = await OrderModel.findByIdAndDelete(id);
    if (!result) {
      throw new Error(`Order ${id} not found`);
    }
  }

  async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    const orders = await OrderModel.find({ status }).sort({ createdAt: -1 });
    return orders.map(order => ({
      id: order._id.toString(),
      type: order.type,
      status: order.status,
      phoneNumber: order.phoneNumber,
      customerName: order.customerName,
      tableNumber: order.tableNumber,
      items: order.items.map(item => ({
        id: item._id.toString(),
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        specialInstructions: item.specialInstructions,
      })),
      specialInstructions: order.specialInstructions,
      total: order.total,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));
  }

  async getOrdersByPhoneNumber(phoneNumber: string): Promise<Order[]> {
    // Get orders from the last 24 hours for this phone number
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const orders = await OrderModel.find({
      phoneNumber,
      createdAt: { $gte: oneDayAgo }
    }).sort({ createdAt: -1 });

    return orders.map(order => ({
      id: order._id.toString(),
      type: order.type,
      status: order.status,
      customerName: order.customerName,
      tableNumber: order.tableNumber,
      phoneNumber: order.phoneNumber,
      items: order.items.map(item => ({
        id: item._id.toString(),
        menuItemId: item.menuItemId.toString(),
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions
      })),
      specialInstructions: order.specialInstructions,
      total: order.total,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }));
  }
}

export const storage = new MongoStorage();

async function initializeDefaultMenu(storage: MongoStorage) {
  const count = await MenuItemModel.countDocuments();
  if (count === 0) {
    const defaultItems: InsertMenuItem[] = [
      {
        name: "Classic Caesar Salad",
        description: "Crisp romaine lettuce, parmesan, croutons, caesar dressing",
        price: 1295,
        category: "starters",
        imageUrl: "https://images.unsplash.com/photo-1470337458703-46ad1756a187",
        allergens: ["gluten", "dairy", "eggs"],
        prepTime: 15,
        available: true,
        ingredients: ["romaine lettuce", "parmesan cheese", "croutons", "caesar dressing"],
        calories: 450,
        protein: 15,
        carbs: 30,
        fat: 20,
      },
      {
        name: "Grilled Salmon",
        description: "Fresh Atlantic salmon with lemon butter sauce",
        price: 2495,
        category: "mains",
        imageUrl: "https://images.unsplash.com/photo-1485963631004-f2f00b1d6606",
        allergens: ["fish"],
        prepTime: 25,
        available: true,
        ingredients: ["salmon", "lemon", "butter"],
        calories: 500,
        protein: 30,
        carbs: 10,
        fat: 30,
      },
    ];

    for (const item of defaultItems) {
      await storage.createMenuItem(item);
    }
  }
}

async function initializeDefaultAdmin(storage: MongoStorage) {
  const adminCount = await UserModel.countDocuments({ role: 'admin' });
  if (adminCount === 0) {
    await storage.createUser({
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      name: 'Administrator',
      email: 'admin@example.com',
      active: true,
    });
  }
}

initializeDefaultMenu(storage).catch(console.error);
initializeDefaultAdmin(storage).catch(console.error);