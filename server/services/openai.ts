import OpenAI from "openai";
import { MenuItem } from "@shared/schema";
import { downloadImage } from "./image-utils";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
export async function generateMenuItem(name: string): Promise<Partial<MenuItem>> {
  try {
    // Generate menu item details
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a culinary expert and dietary specialist helping to generate detailed menu item information. 
          Generate realistic menu item details in JSON format. The JSON should include:
          - description: appetizing description
          - price: in cents
          - category: one of: starters, mains, desserts, drinks, sides
          - ingredients: detailed list
          - preparation_time: in minutes
          - allergens: from [gluten, dairy, nuts, eggs, soy, shellfish, fish, peanuts]
          - calories, protein, carbs, fat: in grams
          - dietary_info: analyze ingredients to determine which apply [vegan, vegetarian, gluten-free, dairy-free, keto, paleo]
          
          For dietary_info, carefully analyze ingredients and preparation method to accurately determine applicable dietary labels.`,
        },
        {
          role: "user",
          content: `Generate a complete menu item description for "${name}". Make it sound professional and appetizing. Consider:
          1. Traditional ingredients and preparation methods
          2. Careful analysis of dietary restrictions based on ingredients
          3. Accurate nutritional calculations
          4. Realistic price point
          Return a detailed JSON object with all specified fields.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    console.log('OpenAI API Response:', result);

    // Generate image using DALL-E
    console.log('Generating image for:', name);
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Professional food photography of ${name}, ${result.description}. The image should be well-lit, appetizing, and suitable for a restaurant menu.`,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    if (!imageResponse.data[0]?.url) {
      throw new Error('Failed to generate image');
    }

    // Download and store the image locally
    console.log('Downloading generated image...');
    const localImageUrl = await downloadImage(imageResponse.data[0].url);
    console.log('Image stored locally at:', localImageUrl);

    return {
      name,
      description: result.description,
      price: result.price,
      category: result.category,
      imageUrl: localImageUrl,
      allergens: result.allergens,
      prepTime: result.prepTime || result.preparation_time || result.preparation_time_minutes,
      ingredients: result.ingredients,
      calories: result.calories || result.nutritional_information?.calories,
      protein: result.protein || result.nutritional_information?.protein,
      carbs: result.carbs || result.nutritional_information?.carbs,
      fat: result.fat || result.nutritional_information?.fat,
      dietaryInfo: result.dietary_info || [],
      available: true,
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error('Failed to generate menu item details');
  }
}

export async function suggestDietaryModifications(
  menuItem: MenuItem,
  dietaryPreferences: string[]
): Promise<{ modifications: string[]; nutritionalImpact: string }> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a culinary expert specializing in dietary modifications. Suggest realistic modifications to accommodate dietary preferences while maintaining the dish's essence. Return suggestions in JSON format with 'modifications' array of strings and 'nutritionalImpact' string description.",
        },
        {
          role: "user",
          content: `Suggest modifications for "${menuItem.name}" to accommodate these dietary preferences: ${dietaryPreferences.join(", ")}.\n\nCurrent ingredients: ${menuItem.ingredients.join(", ")}\nCurrent allergens: ${menuItem.allergens.join(", ")}\n\nProvide practical modifications and explain their nutritional impact. Return in JSON format with 'modifications' array and 'nutritionalImpact' string.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Transform the response if it's in the wrong format
    if (result.originalIngredient || result.substituteWith) {
      return {
        modifications: [`Replace ${result.originalIngredient} with ${result.substituteWith}`],
        nutritionalImpact: result.description || "No significant nutritional impact",
      };
    }

    return {
      modifications: result.modifications || [],
      nutritionalImpact: result.nutritionalImpact || "No significant nutritional impact",
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error('Failed to generate dietary modifications');
  }
}

// Add a new function to analyze dietary preferences for existing items
export async function analyzeDietaryInfo(
  name: string,
  ingredients: string[],
  description: string
): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a dietary specialist analyzing menu items. Based on ingredients and preparation methods, determine which dietary categories apply from: [vegan, vegetarian, gluten-free, dairy-free, keto, paleo]. Return a JSON object with a "dietary_categories" array containing the applicable categories.`,
        },
        {
          role: "user",
          content: `Analyze this menu item for dietary categories:
          Name: ${name}
          Ingredients: ${ingredients.join(", ")}
          Description: ${description}
          
          Return a JSON object with a "dietary_categories" array containing ONLY applicable dietary categories from: [vegan, vegetarian, gluten-free, dairy-free, keto, paleo].`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.dietary_categories || [];
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error('Failed to analyze dietary information');
  }
}

// Add this new function after the existing functions
export async function analyzeKitchenWorkflow(
  activeOrders: any[],
  kitchenStaff: number = 2 // Default assumption of staff count
): Promise<{
  suggestions: string[];
  priorityOrder: string[];
  estimatedTimes: Record<string, number>;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a kitchen workflow optimization expert. Analyze the current orders and provide:
          1. Practical suggestions for optimizing kitchen workflow
          2. Recommended priority order for items
          3. Estimated preparation times for concurrent preparation

          Focus on efficiency, quality, and practical kitchen operations.
          Return a JSON object with suggestions array, priorityOrder array, and estimatedTimes object.`,
        },
        {
          role: "user",
          content: `Analyze these active orders and provide kitchen workflow optimization:
          Active Orders: ${JSON.stringify(activeOrders, null, 2)}
          Kitchen Staff Count: ${kitchenStaff}

          Consider:
          1. Preparation times and dependencies
          2. Common ingredients and preparation steps
          3. Optimal batch processing opportunities
          4. Staff allocation suggestions

          Return specific, actionable suggestions in JSON format.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      suggestions: result.suggestions || [],
      priorityOrder: result.priorityOrder || [],
      estimatedTimes: result.estimatedTimes || {},
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error('Failed to analyze kitchen workflow');
  }
}