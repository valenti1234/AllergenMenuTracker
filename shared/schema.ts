import { z } from "zod";

// Supported languages
export const languages = ["en", "it", "es"] as const;
export type Language = typeof languages[number];

// Existing allergens and categories...
export const allergens = [
  "gluten",
  "dairy",
  "nuts",
  "eggs",
  "soy",
  "shellfish",
  "fish",
  "peanuts"
] as const;

export type Allergen = typeof allergens[number];

export const categories = [
  "starters",
  "mains",
  "desserts",
  "drinks",
  "sides"
] as const;

export type Category = typeof categories[number];

// Add dietary preferences
export const dietaryPreferences = [
  "vegan",
  "vegetarian",
  "gluten-free",
  "dairy-free",
  "keto",
  "paleo"
] as const;

export type DietaryPreference = typeof dietaryPreferences[number];

// Order status types and other existing types remain unchanged...
export const orderStatuses = ["pending", "preparing", "delayed", "ready", "served", "completed", "cancelled"] as const;
export type OrderStatus = typeof orderStatuses[number];

export const orderTypes = ["dine-in", "takeaway"] as const;
export type OrderType = typeof orderTypes[number];

// Define multilingual content schema
const multilingualStringSchema = z.object({
  en: z.string().min(1, "English name is required"),
  it: z.string().default(""),
  es: z.string().default("")
});

const multilingualStringArraySchema = z.object({
  en: z.array(z.string()).min(1, "At least one ingredient in English is required"),
  it: z.array(z.string()).default([]),
  es: z.array(z.string()).default([])
});

// Rest of the order and user schemas remain unchanged...
export const insertOrderItemSchema = z.object({
  menuItemId: z.string(),
  quantity: z.number().min(1),
  specialInstructions: z.string().optional(),
  name: multilingualStringSchema,
});

export type OrderItem = z.infer<typeof insertOrderItemSchema> & {
  id: string;
  price: number;
};

export const insertOrderSchema = z.object({
  type: z.enum(orderTypes),
  status: z.enum(orderStatuses).default("pending"),
  customerName: z.string().min(1, "Customer name is required").optional(),
  tableNumber: z.string().optional(),
  phoneNumber: z.string().min(10, "Phone number is required").max(15, "Phone number is too long"),
  items: z.array(insertOrderItemSchema).min(1, "At least one item is required"),
  specialInstructions: z.string().optional(),
}).refine(
  (data) => {
    if (data.type === "takeaway") {
      return !!data.customerName;
    } else if (data.type === "dine-in") {
      return !!data.tableNumber;
    }
    return true;
  },
  {
    message: "Customer name is required for takeaway orders, table number is required for dine-in orders",
    path: ["type"],
  }
);

export type Order = {
  id: string;
  type: OrderType;
  status: OrderStatus;
  customerName?: string;
  tableNumber?: string;
  phoneNumber: string;
  items: OrderItem[];
  specialInstructions?: string;
  total: number;
  createdAt: Date;
  updatedAt: Date;
};

// Update MenuItem schema to include dietary info and multilingual content
export const insertMenuItemSchema = z.object({
  name: multilingualStringSchema,
  description: multilingualStringSchema,
  price: z.number().min(0, "Price must be positive"),
  category: z.enum(categories),
  imageUrl: z.string(),
  allergens: z.array(z.enum(allergens)),
  prepTime: z.number().min(1, "Prep time must be at least 1 minute"),
  available: z.boolean().default(true),
  ingredients: multilingualStringArraySchema,
  calories: z.number().min(0, "Calories must be positive").optional(),
  protein: z.number().min(0, "Protein must be positive").optional(),
  carbs: z.number().min(0, "Carbs must be positive").optional(),
  fat: z.number().min(0, "Fat must be positive").optional(),
  dietaryInfo: z.array(z.enum(dietaryPreferences)).default([]),
});

export type MenuItem = {
  id: string;
  name: Record<Language, string>;
  description: Record<Language, string>;
  price: number;
  category: Category;
  imageUrl: string;
  allergens: Allergen[];
  prepTime: number;
  available: boolean;
  ingredients: Record<Language, string[]>;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  dietaryInfo: DietaryPreference[];
};

// Update userRoles to include "kitchen"
export const userRoles = ["admin", "manager", "kitchen"] as const;
export type UserRole = typeof userRoles[number];

export const insertUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(userRoles).default("admin"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  active: z.boolean().default(true),
});

export type User = z.infer<typeof insertUserSchema> & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

export type InsertUser = z.infer<typeof insertUserSchema>;