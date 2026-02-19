import { getDatabase } from '../index';
import { Meal, FoodItem } from '@/src/types';
import { generateId, safeJsonParse } from '@/src/utils/date';

// Database row types for type-safe SQL queries
interface MealRow {
  id: string;
  date: string;
  meal_type: string;
  name: string | null;
  total_calories: number;
  total_protein: number | null;
  total_carbs: number | null;
  total_fat: number | null;
  total_fiber: number | null;
  photo_uri: string | null;
  ai_analysis: string | null;
  created_at: string;
  updated_at: string;
}

interface FoodItemRow {
  id: string;
  meal_id: string;
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  is_ai_generated: number;
  confidence: number | null;
}

interface MealTotalsRow {
  total_calories: number | null;
  total_protein: number | null;
  total_carbs: number | null;
  total_fat: number | null;
}

interface DailyTotalsRow {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const nutritionRepository = {
  async getAllMeals(): Promise<Meal[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<MealRow>(
      'SELECT * FROM meals ORDER BY date DESC, created_at DESC',
    );
    return attachFoodsToMeals(db, rows.map(mapRowToMeal));
  },

  async getMealById(id: string): Promise<Meal | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<MealRow>('SELECT * FROM meals WHERE id = ?', id);
    if (!row) return null;

    const meal = mapRowToMeal(row);
    meal.foods = await this.getFoodItemsForMeal(meal.id);
    return meal;
  },

  async getMealsByDate(date: string): Promise<Meal[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<MealRow>(
      'SELECT * FROM meals WHERE date = ? ORDER BY created_at',
      date,
    );
    return attachFoodsToMeals(db, rows.map(mapRowToMeal));
  },

  async getMealsByDateRange(startDate: string, endDate: string): Promise<Meal[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<MealRow>(
      'SELECT * FROM meals WHERE date >= ? AND date <= ? ORDER BY created_at',
      startDate,
      endDate,
    );
    return attachFoodsToMeals(db, rows.map(mapRowToMeal));
  },

  async getFoodItemsForMeal(mealId: string): Promise<FoodItem[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<FoodItemRow>(
      'SELECT * FROM food_items WHERE meal_id = ?',
      mealId,
    );
    return rows.map(mapRowToFoodItem);
  },

  async createMeal(
    meal: Omit<Meal, 'id' | 'foods' | 'createdAt' | 'updatedAt'>,
    foods: Omit<FoodItem, 'id' | 'mealId'>[],
  ): Promise<Meal> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const mealId = generateId();

    await db.runAsync(
      `INSERT INTO meals (id, date, meal_type, name, total_calories, total_protein, total_carbs, total_fat, total_fiber, photo_uri, ai_analysis, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      mealId,
      meal.date,
      meal.mealType,
      meal.name ?? null,
      meal.totalCalories,
      meal.totalProtein ?? null,
      meal.totalCarbs ?? null,
      meal.totalFat ?? null,
      meal.totalFiber ?? null,
      meal.photoUri ?? null,
      meal.aiAnalysis ? JSON.stringify(meal.aiAnalysis) : null,
      now,
      now,
    );

    // Insert food items
    const createdFoods: FoodItem[] = [];
    for (const food of foods) {
      const foodId = generateId();
      await db.runAsync(
        `INSERT INTO food_items (id, meal_id, name, quantity, unit, calories, protein, carbs, fat, is_ai_generated, confidence)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        foodId,
        mealId,
        food.name,
        food.quantity,
        food.unit,
        food.calories,
        food.protein ?? null,
        food.carbs ?? null,
        food.fat ?? null,
        food.isAIGenerated ? 1 : 0,
        food.confidence ?? null,
      );
      createdFoods.push({ ...food, id: foodId, mealId });
    }

    return {
      ...meal,
      id: mealId,
      foods: createdFoods,
      createdAt: now,
      updatedAt: now,
    };
  },

  async updateMeal(
    id: string,
    updates: Partial<Omit<Meal, 'id' | 'foods' | 'createdAt' | 'updatedAt'>>,
  ): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.date !== undefined) {
      fields.push('date = ?');
      values.push(updates.date);
    }
    if (updates.mealType !== undefined) {
      fields.push('meal_type = ?');
      values.push(updates.mealType);
    }
    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.totalCalories !== undefined) {
      fields.push('total_calories = ?');
      values.push(updates.totalCalories);
    }
    if (updates.totalProtein !== undefined) {
      fields.push('total_protein = ?');
      values.push(updates.totalProtein);
    }
    if (updates.totalCarbs !== undefined) {
      fields.push('total_carbs = ?');
      values.push(updates.totalCarbs);
    }
    if (updates.totalFat !== undefined) {
      fields.push('total_fat = ?');
      values.push(updates.totalFat);
    }
    if (updates.totalFiber !== undefined) {
      fields.push('total_fiber = ?');
      values.push(updates.totalFiber);
    }
    if (updates.photoUri !== undefined) {
      fields.push('photo_uri = ?');
      values.push(updates.photoUri);
    }
    if (updates.aiAnalysis !== undefined) {
      fields.push('ai_analysis = ?');
      values.push(JSON.stringify(updates.aiAnalysis));
    }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    await db.runAsync(`UPDATE meals SET ${fields.join(', ')} WHERE id = ?`, ...values);
  },

  async deleteMeal(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM meals WHERE id = ?', id);
  },

  async addFoodItem(mealId: string, food: Omit<FoodItem, 'id' | 'mealId'>): Promise<FoodItem> {
    const db = await getDatabase();
    const foodId = generateId();

    await db.runAsync(
      `INSERT INTO food_items (id, meal_id, name, quantity, unit, calories, protein, carbs, fat, is_ai_generated, confidence)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      foodId,
      mealId,
      food.name,
      food.quantity,
      food.unit,
      food.calories,
      food.protein ?? null,
      food.carbs ?? null,
      food.fat ?? null,
      food.isAIGenerated ? 1 : 0,
      food.confidence ?? null,
    );

    // Update meal totals
    await this.recalculateMealTotals(mealId);

    return { ...food, id: foodId, mealId };
  },

  async deleteFoodItem(id: string, mealId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM food_items WHERE id = ?', id);
    await this.recalculateMealTotals(mealId);
  },

  async recalculateMealTotals(mealId: string): Promise<void> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<MealTotalsRow>(
      `SELECT
        SUM(calories) as total_calories,
        SUM(protein) as total_protein,
        SUM(carbs) as total_carbs,
        SUM(fat) as total_fat
       FROM food_items WHERE meal_id = ?`,
      mealId,
    );

    await db.runAsync(
      `UPDATE meals SET total_calories = ?, total_protein = ?, total_carbs = ?, total_fat = ?, updated_at = ? WHERE id = ?`,
      result?.total_calories ?? 0,
      result?.total_protein ?? null,
      result?.total_carbs ?? null,
      result?.total_fat ?? null,
      new Date().toISOString(),
      mealId,
    );
  },

  async getDailyTotals(
    date: string,
  ): Promise<{ calories: number; protein: number; carbs: number; fat: number }> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<DailyTotalsRow>(
      `SELECT
        COALESCE(SUM(total_calories), 0) as calories,
        COALESCE(SUM(total_protein), 0) as protein,
        COALESCE(SUM(total_carbs), 0) as carbs,
        COALESCE(SUM(total_fat), 0) as fat
       FROM meals WHERE date = ?`,
      date,
    );
    return {
      calories: result?.calories ?? 0,
      protein: result?.protein ?? 0,
      carbs: result?.carbs ?? 0,
      fat: result?.fat ?? 0,
    };
  },
};

async function attachFoodsToMeals(
  db: Awaited<ReturnType<typeof getDatabase>>,
  meals: Meal[],
): Promise<Meal[]> {
  if (meals.length === 0) return meals;

  const mealIds = meals.map((m) => m.id);
  const placeholders = mealIds.map(() => '?').join(',');
  const foodRows = await db.getAllAsync<FoodItemRow>(
    `SELECT * FROM food_items WHERE meal_id IN (${placeholders})`,
    ...mealIds,
  );
  const foodsByMeal = groupFoodsByMealId(foodRows);
  for (const meal of meals) {
    meal.foods = foodsByMeal.get(meal.id) ?? [];
  }
  return meals;
}

function mapRowToMeal(row: MealRow): Meal {
  return {
    id: row.id,
    date: row.date,
    mealType: row.meal_type as Meal['mealType'],
    name: row.name ?? undefined,
    foods: [],
    totalCalories: row.total_calories,
    totalProtein: row.total_protein ?? undefined,
    totalCarbs: row.total_carbs ?? undefined,
    totalFat: row.total_fat ?? undefined,
    totalFiber: row.total_fiber ?? undefined,
    photoUri: row.photo_uri ?? undefined,
    aiAnalysis: safeJsonParse(row.ai_analysis),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function groupFoodsByMealId(rows: FoodItemRow[]): Map<string, FoodItem[]> {
  const map = new Map<string, FoodItem[]>();
  for (const row of rows) {
    const food = mapRowToFoodItem(row);
    const existing = map.get(food.mealId);
    if (existing) {
      existing.push(food);
    } else {
      map.set(food.mealId, [food]);
    }
  }
  return map;
}

function mapRowToFoodItem(row: FoodItemRow): FoodItem {
  return {
    id: row.id,
    mealId: row.meal_id,
    name: row.name,
    quantity: row.quantity,
    unit: row.unit,
    calories: row.calories,
    protein: row.protein ?? undefined,
    carbs: row.carbs ?? undefined,
    fat: row.fat ?? undefined,
    isAIGenerated: Boolean(row.is_ai_generated),
    confidence: row.confidence ?? undefined,
  };
}
