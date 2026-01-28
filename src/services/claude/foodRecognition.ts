import { getClaudeClient } from './client';
import * as FileSystem from 'expo-file-system';
import { DetectedFood, AIFoodAnalysis } from '@/src/types';
import { z } from 'zod';

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
    })
  ),
  totalCalories: z.number(),
  notes: z.string().optional(),
});

export async function analyzeFoodImage(imageUri: string): Promise<AIFoodAnalysis> {
  const startTime = Date.now();
  const client = await getClaudeClient();

  // Read image and convert to base64
  const base64Image = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Determine media type from URI
  const mediaType = imageUri.toLowerCase().includes('.png')
    ? 'image/png'
    : 'image/jpeg';

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
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

  const textContent = response.content.find((block) => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  // Extract JSON from response
  const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse JSON from response');
  }

  const parsedData = JSON.parse(jsonMatch[0]);
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
    modelUsed: 'claude-sonnet-4-20250514',
  };
}
