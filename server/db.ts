import mongoose from 'mongoose';
import { log } from './vite';
import { userRoles, orderTypes, orderStatuses, currencies, languages } from '@shared/schema';

// Ensure MONGODB_URI is properly encoded
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not set');
}

async function attemptConnection(retries = 3, delay = 2000): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      log(`Attempting MongoDB connection (attempt ${attempt}/${retries})`);
      await mongoose.connect(MONGODB_URI!, {
        serverSelectionTimeoutMS: 2000,
        socketTimeoutMS: 30000,
        connectTimeoutMS: 10000,
      });
      log('Connected to MongoDB successfully');
      return;
    } catch (error) {
      log(`Connection attempt ${attempt} failed`);
      if (error instanceof Error) {
        log(`Error type: ${error.name}`);
        log(`Error message: ${error.message}`);
      }

      if (attempt === retries) {
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

export async function connectToDatabase() {
  try {
    await attemptConnection();
  } catch (error) {
    log('All MongoDB connection attempts failed');
    if (error instanceof Error) {
      log(`Final error: ${error.message}`);
    }
    throw error;
  }
}

// MongoDB Schemas
const MenuItemSchema = new mongoose.Schema({
  name: {
    type: {
      en: { type: String, required: true },
      it: { type: String, required: true },
      es: { type: String, required: true }
    },
    required: true
  },
  description: {
    type: {
      en: { type: String, required: true },
      it: { type: String, required: true },
      es: { type: String, required: true }
    },
    required: true
  },
  price: { type: Number, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['starters', 'mains', 'desserts', 'drinks', 'sides']
  },
  imageUrl: { type: String, required: true },
  allergens: { 
    type: [String], 
    required: true,
    enum: ['gluten', 'dairy', 'nuts', 'eggs', 'soy', 'shellfish', 'fish', 'peanuts']
  },
  prepTime: { type: Number, required: true },
  available: { type: Boolean, required: true, default: true },
  ingredients: {
    type: {
      en: { type: [String], required: true },
      it: { type: [String], required: true },
      es: { type: [String], required: true }
    },
    required: true
  },
  calories: { type: Number },
  protein: { type: Number },
  carbs: { type: Number },
  fat: { type: Number },
  dietaryInfo: {
    type: [String],
    enum: ['vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'keto', 'paleo'],
    default: []
  },
  chefRecommended: { 
    type: Boolean, 
    default: false 
  }
});

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    required: true, 
    enum: userRoles,
    default: 'admin'
  },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Order item sub-schema
const OrderItemSchema = new mongoose.Schema({
  menuItemId: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  name: { type: String, required: true },
  specialInstructions: String
});

// Order schema
const OrderSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ["dine-in", "takeaway"],
    required: true
  },
  status: { 
    type: String, 
    enum: ["pending", "preparing", "delayed", "ready", "served", "completed", "cancelled"],
    default: "pending"
  },
  phoneNumber: { type: String, required: true },
  customerName: { type: String },
  tableNumber: { type: String },
  items: {
    type: [OrderItemSchema],
    required: true,
    validate: [(val: any[]) => val.length > 0, 'At least one item is required']
  },
  specialInstructions: { type: String },
  total: { type: Number, required: true },
  paymentStatus: { 
    type: String, 
    enum: ["pending", "paid", "failed", "refunded"], 
    default: "pending" 
  },
  posReference: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Restaurant Settings schema
const RestaurantSettingsSchema = new mongoose.Schema({
  name: {
    type: {
      en: { type: String, required: true },
      it: { type: String },
      es: { type: String }
    },
    required: true
  },
  address: {
    type: {
      en: { type: String },
      it: { type: String },
      es: { type: String }
    }
  },
  phone: { type: String },
  email: { type: String },
  website: { type: String },
  logo: { type: String },
  currency: { 
    type: String, 
    enum: currencies,
    default: 'USD'
  },
  taxRate: { 
    type: Number, 
    min: 0, 
    max: 100, 
    default: 0 
  },
  serviceCharge: { 
    type: Number, 
    min: 0, 
    max: 100, 
    default: 0 
  },
  openingHours: { type: String },
  defaultLanguage: { 
    type: String, 
    enum: languages,
    default: 'en'
  },
  theme: { 
    type: String, 
    enum: ['light', 'dark', 'system'],
    default: 'system'
  },
  enableOnlineOrdering: { 
    type: Boolean, 
    default: true 
  },
  enableReservations: { 
    type: Boolean, 
    default: false 
  },
  enableDelivery: { 
    type: Boolean, 
    default: false 
  },
  deliveryRadius: { type: Number, min: 0 },
  deliveryFee: { type: Number, min: 0 },
  minimumOrderAmount: { type: Number, min: 0 },
  socialMedia: {
    facebook: { type: String },
    instagram: { type: String },
    twitter: { type: String },
    yelp: { type: String }
  },
  paymentOptions: {
    autoRedirectToPayment: { type: Boolean, default: true },
    payAtOrder: { type: Boolean, default: false }
  },
  updatedAt: { type: Date, default: Date.now }
});

// Training Module Schema
const TrainingModuleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true, min: 1 }, // in minutes
  topics: { type: [String], required: true },
  quizId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Quiz Question Schema
const QuestionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  options: { type: [String], required: true },
  correctAnswer: { type: Number, required: true }
});

// Quiz Schema
const QuizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  questions: { type: [QuestionSchema], required: true },
  passingScore: { type: Number, required: true, min: 0, max: 100, default: 70 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Staff Training Record Schema
const StaffTrainingSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  moduleId: { type: String, required: true },
  moduleName: { type: String, required: true },
  completed: { type: Boolean, default: false },
  score: { type: Number, default: null },
  passed: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Inventory Schema
const InventorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  minThreshold: { type: Number, required: true, min: 0 },
  status: { 
    type: String, 
    enum: ["ok", "low", "critical"],
    default: "ok"
  },
  allergens: { 
    type: [String], 
    enum: ['gluten', 'dairy', 'nuts', 'eggs', 'soy', 'shellfish', 'fish', 'peanuts'],
    default: []
  },
  lastUpdated: { type: Date, default: Date.now }
});

// Recipe Mapping Schema
export interface RecipeMapping {
  menuItemId: string;
  ingredients: {
    name: string;
    quantity: number;
    unit: string;
  }[];
  lastUpdated: Date;
  isAutoGenerated: boolean;
}

const RecipeMappingSchema = new mongoose.Schema<RecipeMapping>({
  menuItemId: { type: String, required: true, unique: true },
  ingredients: [{
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true }
  }],
  lastUpdated: { type: Date, default: Date.now },
  isAutoGenerated: { type: Boolean, default: false }
});

// Update timestamp on save
UserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

OrderSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

RestaurantSettingsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

TrainingModuleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

QuizSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

StaffTrainingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const MenuItemModel = mongoose.model('MenuItem', MenuItemSchema);
export const UserModel = mongoose.model('User', UserSchema);
export const OrderModel = mongoose.model('Order', OrderSchema);
export const RestaurantSettingsModel = mongoose.model('RestaurantSettings', RestaurantSettingsSchema);
export const TrainingModule = mongoose.model('TrainingModule', TrainingModuleSchema);
export const Quiz = mongoose.model('Quiz', QuizSchema);
export const StaffTraining = mongoose.model('StaffTraining', StaffTrainingSchema);
export const InventoryModel = mongoose.model('Inventory', InventorySchema);
export const RecipeMappingModel = mongoose.model<RecipeMapping>('RecipeMapping', RecipeMappingSchema);