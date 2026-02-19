import { create } from 'zustand';
import { Meal, FoodItem, AIFoodAnalysis } from '@/src/types';
import { nutritionRepository } from '@/src/database/repositories';
import { analyzeFoodImage } from '@/src/services/claude';
import { getDateString, getErrorMessage } from '@/src/utils/date';

interface NutritionState {
  meals: Meal[];
  dailyTotals: { calories: number; protein: number; carbs: number; fat: number };
  isLoading: boolean;
  isAnalyzing: boolean;
  error: string | null;

  loadMeals: () => Promise<void>;
  loadMealsForDate: (date: string) => Promise<void>;
  loadDailyTotals: (date?: string) => Promise<void>;
  createMeal: (
    meal: Omit<Meal, 'id' | 'foods' | 'createdAt' | 'updatedAt'>,
    foods: Omit<FoodItem, 'id' | 'mealId'>[],
  ) => Promise<Meal>;
  updateMeal: (
    id: string,
    updates: Partial<Omit<Meal, 'id' | 'foods' | 'createdAt' | 'updatedAt'>>,
  ) => Promise<void>;
  deleteMeal: (id: string) => Promise<void>;
  addFoodItem: (mealId: string, food: Omit<FoodItem, 'id' | 'mealId'>) => Promise<FoodItem>;
  deleteFoodItem: (id: string, mealId: string) => Promise<void>;
  analyzeImage: (imageUri: string) => Promise<AIFoodAnalysis>;
  clearError: () => void;
}

export const useNutritionStore = create<NutritionState>((set, get) => ({
  meals: [],
  dailyTotals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
  isLoading: false,
  isAnalyzing: false,
  error: null,

  loadMeals: async () => {
    set({ isLoading: true, error: null });
    try {
      const meals = await nutritionRepository.getAllMeals();
      set({ meals, isLoading: false });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  loadMealsForDate: async (date) => {
    set({ isLoading: true, error: null });
    try {
      const meals = await nutritionRepository.getMealsByDate(date);
      set({ meals, isLoading: false });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  loadDailyTotals: async (date) => {
    const dateStr = date || getDateString();
    try {
      const totals = await nutritionRepository.getDailyTotals(dateStr);
      set({ dailyTotals: totals });
    } catch (error) {
      set({ error: getErrorMessage(error) });
    }
  },

  createMeal: async (mealData, foods) => {
    set({ isLoading: true, error: null });
    try {
      const meal = await nutritionRepository.createMeal(mealData, foods);
      set((state) => ({
        meals: [meal, ...state.meals].sort((a, b) => b.date.localeCompare(a.date)),
        isLoading: false,
      }));
      // Reload daily totals
      await get().loadDailyTotals(mealData.date);
      return meal;
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
      throw error;
    }
  },

  updateMeal: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      await nutritionRepository.updateMeal(id, updates);
      const meal = get().meals.find((m) => m.id === id);
      set((state) => ({
        meals: state.meals.map((m) =>
          m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m,
        ),
        isLoading: false,
      }));
      if (meal) {
        await get().loadDailyTotals(meal.date);
      }
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
      throw error;
    }
  },

  deleteMeal: async (id) => {
    const meal = get().meals.find((m) => m.id === id);
    set({ isLoading: true, error: null });
    try {
      await nutritionRepository.deleteMeal(id);
      set((state) => ({
        meals: state.meals.filter((m) => m.id !== id),
        isLoading: false,
      }));
      if (meal) {
        await get().loadDailyTotals(meal.date);
      }
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
      throw error;
    }
  },

  addFoodItem: async (mealId, food) => {
    try {
      const foodItem = await nutritionRepository.addFoodItem(mealId, food);
      set((state) => ({
        meals: state.meals.map((m) =>
          m.id === mealId ? { ...m, foods: [...m.foods, foodItem] } : m,
        ),
      }));
      const meal = get().meals.find((m) => m.id === mealId);
      if (meal) {
        await get().loadDailyTotals(meal.date);
      }
      return foodItem;
    } catch (error) {
      set({ error: getErrorMessage(error) });
      throw error;
    }
  },

  deleteFoodItem: async (id, mealId) => {
    try {
      await nutritionRepository.deleteFoodItem(id, mealId);
      set((state) => ({
        meals: state.meals.map((m) =>
          m.id === mealId ? { ...m, foods: m.foods.filter((f) => f.id !== id) } : m,
        ),
      }));
      const meal = get().meals.find((m) => m.id === mealId);
      if (meal) {
        await get().loadDailyTotals(meal.date);
      }
    } catch (error) {
      set({ error: getErrorMessage(error) });
      throw error;
    }
  },

  analyzeImage: async (imageUri) => {
    set({ isAnalyzing: true, error: null });
    try {
      const analysis = await analyzeFoodImage(imageUri);
      set({ isAnalyzing: false });
      return analysis;
    } catch (error) {
      set({ error: getErrorMessage(error), isAnalyzing: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
