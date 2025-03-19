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

// Aggiungi gli stati di pagamento
export const paymentStatuses = ["pending", "paid", "failed", "refunded"] as const;
export type PaymentStatus = typeof paymentStatuses[number];

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
  // Aggiungi campi per il pagamento
  paymentStatus: z.enum(paymentStatuses).default("pending"),
  posReference: z.string().optional(),
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
  // Aggiungi campi per il pagamento
  paymentStatus: PaymentStatus;
  posReference?: string;
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
  chefRecommended: z.boolean().default(false),
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
  chefRecommended?: boolean;
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

// Restaurant settings
export const currencies = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "INR"] as const;
export type Currency = typeof currencies[number];

// Aggiungi i tipi di POS supportati
export const posTypes = ["none", "stripe", "square", "clover"] as const;
export type POSType = typeof posTypes[number];

export const insertRestaurantSettingsSchema = z.object({
  name: multilingualStringSchema,
  address: multilingualStringSchema.optional(),
  phone: z.string().min(10, "Phone number is required").max(15, "Phone number is too long").optional(),
  email: z.string().email("Invalid email address").optional(),
  website: z.string().url("Invalid website URL").optional(),
  logo: z.string().optional(),
  currency: z.enum(currencies).default("USD"),
  taxRate: z.number().min(0, "Tax rate must be positive").max(100, "Tax rate must be less than 100").default(0),
  serviceCharge: z.number().min(0, "Service charge must be positive").max(100, "Service charge must be less than 100").default(0),
  openingHours: z.string().optional(),
  defaultLanguage: z.enum(languages).default("en"),
  theme: z.enum(["light", "dark", "system"]).default("system"),
  enableOnlineOrdering: z.boolean().default(true),
  enableReservations: z.boolean().default(false),
  enableDelivery: z.boolean().default(false),
  deliveryRadius: z.number().min(0, "Delivery radius must be positive").optional(),
  deliveryFee: z.number().min(0, "Delivery fee must be positive").optional(),
  minimumOrderAmount: z.number().min(0, "Minimum order amount must be positive").optional(),
  // Aggiungi opzione per il pagamento automatico
  paymentOptions: z.object({
    autoRedirectToPayment: z.boolean().default(true),
    payAtOrder: z.boolean().default(false),
  }).default({
    autoRedirectToPayment: true,
    payAtOrder: false,
  }),
  socialMedia: z.object({
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    twitter: z.string().optional(),
    yelp: z.string().optional(),
  }).optional(),
  // Aggiungi configurazione POS
  posIntegration: z.object({
    enabled: z.boolean().default(false),
    type: z.enum(posTypes).default("none"),
    config: z.record(z.string(), z.any()).optional(),
  }).optional(),
});

export type RestaurantSettings = z.infer<typeof insertRestaurantSettingsSchema> & {
  id: string;
  updatedAt: Date;
};

export type InsertRestaurantSettings = z.infer<typeof insertRestaurantSettingsSchema>;

// Training Module Types
export const trainingQuestionSchema = z.object({
  text: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.number()
});

export type TrainingQuestion = z.infer<typeof trainingQuestionSchema>;

export const trainingQuizSchema = z.object({
  title: z.string(),
  description: z.string(),
  questions: z.array(trainingQuestionSchema),
  passingScore: z.number().min(0).max(100).default(70)
});

export type TrainingQuiz = z.infer<typeof trainingQuizSchema> & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

export const trainingModuleSchema = z.object({
  title: z.string(),
  description: z.string(),
  duration: z.number().min(1),
  topics: z.array(z.string()),
  quizId: z.string()
});

export type TrainingModule = z.infer<typeof trainingModuleSchema> & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

export const staffTrainingRecordSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  moduleId: z.string(),
  moduleName: z.string(),
  completed: z.boolean().default(false),
  score: z.number().nullable().optional(),
  passed: z.boolean().default(false),
  completedAt: z.date().nullable().optional()
});

export type StaffTrainingRecord = z.infer<typeof staffTrainingRecordSchema> & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

export const inventoryItemSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  quantity: z.number().min(0),
  unit: z.string().min(1),
  minThreshold: z.number().min(0),
  status: z.enum(["ok", "low", "critical"]),
  lastUpdated: z.string()
});

export type InventoryItem = z.infer<typeof inventoryItemSchema>;

export const insertInventoryItemSchema = inventoryItemSchema.omit({ 
  status: true,
  lastUpdated: true 
});

export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;