import { getClaudeClient } from './client';
import * as FileSystem from 'expo-file-system/legacy';
import { DetectedFood, AIFoodAnalysis } from '@/src/types';
import { z } from 'zod';
import { AI_MODEL, AI_MAX_TOKENS, withTimeout } from '@/src/utils/constants';

const FoodAnalysisSchema = z.object({
  foods: z.array(
    z.object({
      name: z.string(),
      portion: z.string(),
      calories: z.number(),
      protein: z.number().optional(),
      carbs: z.number().optional(),
      fat: z.number().optional(),
      confidence: z.number().min(0).max(1),
    }),
  ),
  totalCalories: z.number(),
  notes: z.string().optional(),
});

function parseJsonFromResponse(text: string): unknown {
  // Try direct parse first (response may be pure JSON)
  try {
    return JSON.parse(text);
  } catch {
    // Fall back to regex extraction if wrapped in markdown/text
  }
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not find JSON in response');
  }
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error('Invalid JSON in response');
  }
}

function getMediaType(uri: string): 'image/png' | 'image/jpeg' {
  return uri.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
}

export async function analyzeFoodImage(imageUri: string): Promise<AIFoodAnalysis> {
  const startTime = Date.now();
  const client = await getClaudeClient();

  const base64Image = await FileSystem.readAsStringAsync(imageUri, {
    encoding: 'base64',
  });

  const apiCall = client.messages.create({
    model: AI_MODEL,
    max_tokens: AI_MAX_TOKENS,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: getMediaType(imageUri),
              data: base64Image,
            },
          },
          {
            type: 'text',
            text: `Analyze this food image and provide nutritional estimates.

Return a JSON object with this exact structure:
{
  "foods": [
    {
      "name": "food item name",
      "portion": "estimated portion size (e.g., '1 cup', '6 oz', '1 medium')",
      "calories": estimated calories as number,
      "protein": grams of protein as number,
      "carbs": grams of carbs as number,
      "fat": grams of fat as number,
      "confidence": confidence score from 0 to 1
    }
  ],
  "totalCalories": sum of all calories,
  "notes": "any relevant notes about the meal"
}

Be conservative with portion estimates. If you cannot identify a food item clearly, still include it with a lower confidence score. Focus on accuracy over completeness.

Return ONLY the JSON object, no other text.`,
          },
        ],
      },
    ],
  });

  const response = await withTimeout(apiCall, 'Food analysis timed out. Please try again.');

  const textContent = response.content.find((block) => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  const parsedData = parseJsonFromResponse(textContent.text);
  const validated = FoodAnalysisSchema.parse(parsedData);

  const detectedFoods: DetectedFood[] = validated.foods.map((food) => ({
    name: food.name,
    portionEstimate: food.portion,
    calorieEstimate: food.calories,
    macroEstimates:
      food.protein !== undefined
        ? {
            protein: food.protein,
            carbs: food.carbs ?? 0,
            fat: food.fat ?? 0,
          }
        : undefined,
    confidence: food.confidence,
  }));

  return {
    rawResponse: textContent.text,
    detectedFoods,
    processingTimeMs: Date.now() - startTime,
    modelUsed: AI_MODEL,
  };
}
