import { useNutritionStore } from '@/src/store/nutritionStore';
import { Meal, FoodItem } from '@/src/types';

jest.mock('@/src/database/repositories', () => ({
  nutritionRepository: {
    getAllMeals: jest.fn(),
    getMealsByDate: jest.fn(),
    getDailyTotals: jest.fn(),
    createMeal: jest.fn(),
    updateMeal: jest.fn(),
    deleteMeal: jest.fn(),
    addFoodItem: jest.fn(),
    deleteFoodItem: jest.fn(),
  },
}));

jest.mock('@/src/services/claude', () => ({
  analyzeFoodImage: jest.fn(),
}));

jest.mock('@/src/utils/date', () => ({
  getDateString: jest.fn(() => '2026-02-18'),
  getErrorMessage: jest.fn((error: unknown) =>
    error instanceof Error ? error.message : 'An unexpected error occurred',
  ),
}));

const { nutritionRepository } = jest.requireMock('@/src/database/repositories');
const { analyzeFoodImage } = jest.requireMock('@/src/services/claude');

const mockFood: FoodItem = {
  id: 'f1',
  mealId: 'm1',
  name: 'Banana',
  quantity: 1,
  unit: 'medium',
  calories: 105,
  protein: 1.3,
  carbs: 27,
  fat: 0.4,
  isAIGenerated: false,
};

const mockMeal: Meal = {
  id: 'm1',
  date: '2026-02-18',
  mealType: 'breakfast',
  name: 'Morning meal',
  foods: [mockFood],
  totalCalories: 105,
  totalProtein: 1.3,
  totalCarbs: 27,
  totalFat: 0.4,
  createdAt: '2026-02-18T08:00:00.000Z',
  updatedAt: '2026-02-18T08:00:00.000Z',
};

function resetStore() {
  useNutritionStore.setState({
    meals: [],
    dailyTotals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    isLoading: false,
    isAnalyzing: false,
    error: null,
  });
}

beforeEach(() => {
  resetStore();
  jest.clearAllMocks();
});

describe('nutritionStore', () => {
  describe('initial state', () => {
    it('starts with empty meals', () => {
      expect(useNutritionStore.getState().meals).toEqual([]);
    });

    it('starts with zero daily totals', () => {
      expect(useNutritionStore.getState().dailyTotals).toEqual({
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      });
    });

    it('starts without error', () => {
      expect(useNutritionStore.getState().error).toBeNull();
    });
  });

  describe('loadMeals', () => {
    it('loads meals from repository', async () => {
      nutritionRepository.getAllMeals.mockResolvedValue([mockMeal]);

      await useNutritionStore.getState().loadMeals();

      expect(useNutritionStore.getState().meals).toEqual([mockMeal]);
      expect(useNutritionStore.getState().isLoading).toBe(false);
    });

    it('sets error on failure', async () => {
      nutritionRepository.getAllMeals.mockRejectedValue(new Error('DB error'));

      await useNutritionStore.getState().loadMeals();

      expect(useNutritionStore.getState().error).toBe('DB error');
    });
  });

  describe('loadMealsForDate', () => {
    it('loads meals for specific date', async () => {
      nutritionRepository.getMealsByDate.mockResolvedValue([mockMeal]);

      await useNutritionStore.getState().loadMealsForDate('2026-02-18');

      expect(nutritionRepository.getMealsByDate).toHaveBeenCalledWith('2026-02-18');
      expect(useNutritionStore.getState().meals).toEqual([mockMeal]);
    });
  });

  describe('loadDailyTotals', () => {
    it('loads daily totals from repository', async () => {
      const totals = { calories: 500, protein: 20, carbs: 60, fat: 15 };
      nutritionRepository.getDailyTotals.mockResolvedValue(totals);

      await useNutritionStore.getState().loadDailyTotals('2026-02-18');

      expect(useNutritionStore.getState().dailyTotals).toEqual(totals);
    });

    it('uses current date when no date provided', async () => {
      nutritionRepository.getDailyTotals.mockResolvedValue({
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      });

      await useNutritionStore.getState().loadDailyTotals();

      expect(nutritionRepository.getDailyTotals).toHaveBeenCalledWith('2026-02-18');
    });

    it('silently fails on error', async () => {
      nutritionRepository.getDailyTotals.mockRejectedValue(new Error('fail'));

      await useNutritionStore.getState().loadDailyTotals('2026-02-18');

      // Should not set error - silent fail
      expect(useNutritionStore.getState().error).toBeNull();
    });
  });

  describe('createMeal', () => {
    it('creates meal and adds to state', async () => {
      nutritionRepository.createMeal.mockResolvedValue(mockMeal);
      nutritionRepository.getDailyTotals.mockResolvedValue({
        calories: 105,
        protein: 1.3,
        carbs: 27,
        fat: 0.4,
      });

      const result = await useNutritionStore
        .getState()
        .createMeal({ date: '2026-02-18', mealType: 'breakfast', totalCalories: 105 }, [
          { name: 'Banana', quantity: 1, unit: 'medium', calories: 105, isAIGenerated: false },
        ]);

      expect(result).toEqual(mockMeal);
      expect(useNutritionStore.getState().meals).toContain(mockMeal);
    });

    it('throws on failure', async () => {
      nutritionRepository.createMeal.mockRejectedValue(new Error('Create failed'));

      await expect(
        useNutritionStore
          .getState()
          .createMeal({ date: '2026-02-18', mealType: 'breakfast', totalCalories: 0 }, []),
      ).rejects.toThrow('Create failed');
    });
  });

  describe('deleteMeal', () => {
    it('removes meal from state', async () => {
      useNutritionStore.setState({ meals: [mockMeal] });
      nutritionRepository.deleteMeal.mockResolvedValue(undefined);
      nutritionRepository.getDailyTotals.mockResolvedValue({
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      });

      await useNutritionStore.getState().deleteMeal('m1');

      expect(useNutritionStore.getState().meals).toEqual([]);
    });
  });

  describe('addFoodItem', () => {
    it('adds food item to meal', async () => {
      const newFood: FoodItem = {
        id: 'f2',
        mealId: 'm1',
        name: 'Apple',
        quantity: 1,
        unit: 'medium',
        calories: 95,
        isAIGenerated: false,
      };
      useNutritionStore.setState({ meals: [mockMeal] });
      nutritionRepository.addFoodItem.mockResolvedValue(newFood);
      nutritionRepository.getDailyTotals.mockResolvedValue({
        calories: 200,
        protein: 2,
        carbs: 50,
        fat: 1,
      });

      const result = await useNutritionStore.getState().addFoodItem('m1', {
        name: 'Apple',
        quantity: 1,
        unit: 'medium',
        calories: 95,
        isAIGenerated: false,
      });

      expect(result).toEqual(newFood);
      const meal = useNutritionStore.getState().meals.find((m) => m.id === 'm1');
      expect(meal?.foods).toHaveLength(2);
    });
  });

  describe('deleteFoodItem', () => {
    it('removes food item from meal', async () => {
      useNutritionStore.setState({ meals: [mockMeal] });
      nutritionRepository.deleteFoodItem.mockResolvedValue(undefined);
      nutritionRepository.getDailyTotals.mockResolvedValue({
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      });

      await useNutritionStore.getState().deleteFoodItem('f1', 'm1');

      const meal = useNutritionStore.getState().meals.find((m) => m.id === 'm1');
      expect(meal?.foods).toHaveLength(0);
    });
  });

  describe('analyzeImage', () => {
    it('analyzes food image and returns result', async () => {
      const analysis = {
        rawResponse: 'test',
        detectedFoods: [],
        processingTimeMs: 500,
        modelUsed: 'claude-sonnet-4-20250514',
      };
      analyzeFoodImage.mockResolvedValue(analysis);

      const result = await useNutritionStore.getState().analyzeImage('file:///photo.jpg');

      expect(result).toEqual(analysis);
      expect(useNutritionStore.getState().isAnalyzing).toBe(false);
    });

    it('sets error on failure', async () => {
      analyzeFoodImage.mockRejectedValue(new Error('Analysis failed'));

      await expect(useNutritionStore.getState().analyzeImage('file:///photo.jpg')).rejects.toThrow(
        'Analysis failed',
      );

      expect(useNutritionStore.getState().error).toBe('Analysis failed');
      expect(useNutritionStore.getState().isAnalyzing).toBe(false);
    });
  });

  describe('clearError', () => {
    it('clears error state', () => {
      useNutritionStore.setState({ error: 'something' });

      useNutritionStore.getState().clearError();

      expect(useNutritionStore.getState().error).toBeNull();
    });
  });
});
