import { nutritionRepository } from '@/src/database/repositories';

const mockDb = {
  getAllAsync: jest.fn(),
  getFirstAsync: jest.fn(),
  runAsync: jest.fn(),
};

jest.mock('@/src/database/index', () => ({
  getDatabase: jest.fn(() => Promise.resolve(mockDb)),
}));

jest.mock('@/src/utils/date', () => ({
  generateId: jest.fn(() => 'test-id'),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

const mockMealRow = {
  id: 'm1',
  date: '2026-02-18',
  meal_type: 'lunch',
  name: 'Salad',
  total_calories: 400,
  total_protein: 20,
  total_carbs: 30,
  total_fat: 15,
  total_fiber: 5,
  photo_uri: null,
  ai_analysis: null,
  created_at: '2026-02-18T12:00:00.000Z',
  updated_at: '2026-02-18T12:00:00.000Z',
};

const mockFoodItemRow = {
  id: 'f1',
  meal_id: 'm1',
  name: 'Chicken Breast',
  quantity: 1,
  unit: 'piece',
  calories: 250,
  protein: 30,
  carbs: 0,
  fat: 8,
  is_ai_generated: 1,
  confidence: 0.9,
};

describe('nutritionRepository', () => {
  describe('getAllMeals', () => {
    it('returns mapped meals with attached food items', async () => {
      mockDb.getAllAsync
        .mockResolvedValueOnce([mockMealRow])
        .mockResolvedValueOnce([mockFoodItemRow]);

      const meals = await nutritionRepository.getAllMeals();

      expect(meals).toHaveLength(1);
      expect(meals[0].id).toBe('m1');
      expect(meals[0].mealType).toBe('lunch');
      expect(meals[0].totalCalories).toBe(400);
      expect(meals[0].foods).toHaveLength(1);
      expect(meals[0].foods[0].name).toBe('Chicken Breast');
      expect(meals[0].foods[0].isAIGenerated).toBe(true);
    });

    it('groups multiple foods to the same meal', async () => {
      const secondFood = {
        ...mockFoodItemRow,
        id: 'f2',
        name: 'Rice',
        calories: 200,
        protein: 4,
        carbs: 45,
        fat: 0.5,
      };
      mockDb.getAllAsync
        .mockResolvedValueOnce([mockMealRow])
        .mockResolvedValueOnce([mockFoodItemRow, secondFood]);

      const meals = await nutritionRepository.getAllMeals();

      expect(meals[0].foods).toHaveLength(2);
      expect(meals[0].foods[0].name).toBe('Chicken Breast');
      expect(meals[0].foods[1].name).toBe('Rice');
    });

    it('returns empty array when no meals exist', async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([]);

      const meals = await nutritionRepository.getAllMeals();

      expect(meals).toEqual([]);
    });

    it('maps null fields to undefined', async () => {
      mockDb.getAllAsync
        .mockResolvedValueOnce([
          { ...mockMealRow, name: null, total_protein: null, photo_uri: null, ai_analysis: null },
        ])
        .mockResolvedValueOnce([]);

      const meals = await nutritionRepository.getAllMeals();

      expect(meals[0].name).toBeUndefined();
      expect(meals[0].totalProtein).toBeUndefined();
      expect(meals[0].photoUri).toBeUndefined();
      expect(meals[0].aiAnalysis).toBeUndefined();
    });

    it('parses ai_analysis JSON', async () => {
      const analysis = { detectedFoods: [{ name: 'Apple' }] };
      mockDb.getAllAsync
        .mockResolvedValueOnce([{ ...mockMealRow, ai_analysis: JSON.stringify(analysis) }])
        .mockResolvedValueOnce([]);

      const meals = await nutritionRepository.getAllMeals();

      expect(meals[0].aiAnalysis).toEqual(analysis);
    });
  });

  describe('getMealById', () => {
    it('returns meal with food items', async () => {
      mockDb.getFirstAsync.mockResolvedValue(mockMealRow);
      mockDb.getAllAsync.mockResolvedValue([mockFoodItemRow]);

      const meal = await nutritionRepository.getMealById('m1');

      expect(meal).not.toBeNull();
      expect(meal!.id).toBe('m1');
      expect(meal!.foods).toHaveLength(1);
    });

    it('returns null when meal not found', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const meal = await nutritionRepository.getMealById('nonexistent');

      expect(meal).toBeNull();
    });
  });

  describe('getMealsByDate', () => {
    it('returns meals for specific date with foods attached', async () => {
      mockDb.getAllAsync
        .mockResolvedValueOnce([mockMealRow])
        .mockResolvedValueOnce([mockFoodItemRow]);

      const meals = await nutritionRepository.getMealsByDate('2026-02-18');

      expect(meals).toHaveLength(1);
      expect(meals[0].foods).toHaveLength(1);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('WHERE date = ?'),
        '2026-02-18',
      );
    });
  });

  describe('getMealsByDateRange', () => {
    it('returns meals in date range with foods attached', async () => {
      mockDb.getAllAsync
        .mockResolvedValueOnce([mockMealRow])
        .mockResolvedValueOnce([mockFoodItemRow]);

      const meals = await nutritionRepository.getMealsByDateRange('2026-02-15', '2026-02-18');

      expect(meals).toHaveLength(1);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('WHERE date >= ? AND date <= ?'),
        '2026-02-15',
        '2026-02-18',
      );
    });
  });

  describe('createMeal', () => {
    it('inserts meal and food items', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 1 });

      const meal = await nutritionRepository.createMeal(
        {
          date: '2026-02-18',
          mealType: 'lunch',
          name: 'Salad',
          totalCalories: 400,
          totalProtein: 20,
          totalCarbs: 30,
          totalFat: 15,
        },
        [
          {
            name: 'Chicken',
            quantity: 1,
            unit: 'piece',
            calories: 250,
            protein: 30,
            carbs: 0,
            fat: 8,
            isAIGenerated: true,
            confidence: 0.9,
          },
        ],
      );

      expect(meal.id).toBe('test-id');
      expect(meal.foods).toHaveLength(1);
      expect(meal.foods[0].name).toBe('Chicken');
      // meal insert + food item insert = 2 calls
      expect(mockDb.runAsync).toHaveBeenCalledTimes(2);
    });

    it('handles meals with no food items', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 1 });

      const meal = await nutritionRepository.createMeal(
        {
          date: '2026-02-18',
          mealType: 'snack',
          totalCalories: 100,
        },
        [],
      );

      expect(meal.foods).toEqual([]);
      expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateMeal', () => {
    it('updates specified fields', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 1 });

      await nutritionRepository.updateMeal('m1', {
        name: 'Updated Salad',
        totalCalories: 500,
      });

      expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
      const [query] = mockDb.runAsync.mock.calls[0];
      expect(query).toContain('name = ?');
      expect(query).toContain('total_calories = ?');
      expect(query).toContain('updated_at = ?');
    });

    it('updates all optional fields', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 1 });

      await nutritionRepository.updateMeal('m1', {
        date: '2026-02-19',
        mealType: 'dinner',
        totalProtein: 30,
        totalCarbs: 50,
        totalFat: 15,
        totalFiber: 8,
        photoUri: 'file:///photo.jpg',
      });

      const [sql] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain('date = ?');
      expect(sql).toContain('meal_type = ?');
      expect(sql).toContain('total_protein = ?');
      expect(sql).toContain('total_carbs = ?');
      expect(sql).toContain('total_fat = ?');
      expect(sql).toContain('total_fiber = ?');
      expect(sql).toContain('photo_uri = ?');
    });

    it('serializes aiAnalysis to JSON', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 1 });
      const analysis = { detectedFoods: [] };

      await nutritionRepository.updateMeal('m1', {
        aiAnalysis: analysis as never,
      });

      const args = mockDb.runAsync.mock.calls[0];
      expect(args).toContain(JSON.stringify(analysis));
    });
  });

  describe('deleteMeal', () => {
    it('deletes meal by id', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 1 });

      await nutritionRepository.deleteMeal('m1');

      expect(mockDb.runAsync).toHaveBeenCalledWith('DELETE FROM meals WHERE id = ?', 'm1');
    });
  });

  describe('getDailyTotals', () => {
    it('returns aggregated daily totals', async () => {
      mockDb.getFirstAsync.mockResolvedValue({
        calories: 1500,
        protein: 80,
        carbs: 200,
        fat: 50,
      });

      const totals = await nutritionRepository.getDailyTotals('2026-02-18');

      expect(totals).toEqual({
        calories: 1500,
        protein: 80,
        carbs: 200,
        fat: 50,
      });
    });

    it('returns zeros when no meals exist', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const totals = await nutritionRepository.getDailyTotals('2026-02-18');

      expect(totals).toEqual({
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      });
    });
  });

  describe('recalculateMealTotals', () => {
    it('recalculates totals from food items', async () => {
      mockDb.getFirstAsync.mockResolvedValue({
        total_calories: 500,
        total_protein: 40,
        total_carbs: 30,
        total_fat: 20,
      });
      mockDb.runAsync.mockResolvedValue({ changes: 1 });

      await nutritionRepository.recalculateMealTotals('m1');

      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('SUM(calories)'),
        'm1',
      );
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE meals SET'),
        500,
        40,
        30,
        20,
        expect.any(String),
        'm1',
      );
    });
  });

  describe('food item operations', () => {
    it('getFoodItemsForMeal returns mapped food items', async () => {
      mockDb.getAllAsync.mockResolvedValue([mockFoodItemRow]);

      const foods = await nutritionRepository.getFoodItemsForMeal('m1');

      expect(foods).toHaveLength(1);
      expect(foods[0].mealId).toBe('m1');
      expect(foods[0].isAIGenerated).toBe(true);
      expect(foods[0].confidence).toBe(0.9);
    });

    it('getFoodItemsForMeal maps null fields to undefined', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        { ...mockFoodItemRow, protein: null, carbs: null, fat: null, confidence: null },
      ]);

      const foods = await nutritionRepository.getFoodItemsForMeal('m1');

      expect(foods[0].protein).toBeUndefined();
      expect(foods[0].carbs).toBeUndefined();
      expect(foods[0].fat).toBeUndefined();
      expect(foods[0].confidence).toBeUndefined();
    });

    it('addFoodItem inserts and recalculates totals', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 1 });
      mockDb.getFirstAsync.mockResolvedValue({
        total_calories: 500,
        total_protein: 40,
        total_carbs: 30,
        total_fat: 20,
      });

      const food = await nutritionRepository.addFoodItem('m1', {
        name: 'Apple',
        quantity: 1,
        unit: 'piece',
        calories: 95,
        isAIGenerated: false,
      });

      expect(food.id).toBe('test-id');
      expect(food.mealId).toBe('m1');
      // insert food + recalculate (SELECT + UPDATE) = 2 runAsync calls
      expect(mockDb.runAsync).toHaveBeenCalledTimes(2);
    });

    it('deleteFoodItem deletes and recalculates totals', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 1 });
      mockDb.getFirstAsync.mockResolvedValue({
        total_calories: 200,
        total_protein: 10,
        total_carbs: 20,
        total_fat: 5,
      });

      await nutritionRepository.deleteFoodItem('f1', 'm1');

      expect(mockDb.runAsync).toHaveBeenCalledWith('DELETE FROM food_items WHERE id = ?', 'f1');
    });
  });
});
