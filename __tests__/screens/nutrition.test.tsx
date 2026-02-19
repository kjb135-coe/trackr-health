import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@/src/theme/ThemeContext';
import NutritionScreen from '@/app/(tabs)/nutrition';
import { Meal } from '@/src/types';

jest.mock('react-native-reanimated', () => require('../helpers/reanimatedMock').reanimatedMock);

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success' },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@/src/services/claude', () => ({
  useApiKeyExists: () => false,
}));

let mockMeals: Meal[] = [];
let mockDailyTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
let mockIsLoading = false;
let mockError: string | null = null;

const mockLoadMealsForDate = jest.fn();
const mockLoadDailyTotals = jest.fn();
const mockDeleteMeal = jest.fn();
const mockClearError = jest.fn();

const mockFetchNutritionAdvice = jest.fn();

jest.mock('@/src/store', () => ({
  useNutritionStore: () => ({
    meals: mockMeals,
    dailyTotals: mockDailyTotals,
    isLoading: mockIsLoading,
    error: mockError,
    loadMealsForDate: mockLoadMealsForDate,
    loadDailyTotals: mockLoadDailyTotals,
    deleteMeal: mockDeleteMeal,
    clearError: mockClearError,
  }),
  useAIInsightsStore: Object.assign(
    () => ({
      nutritionAdvice: null,
      isLoadingNutrition: false,
      fetchNutritionAdvice: mockFetchNutritionAdvice,
    }),
    { setState: jest.fn() },
  ),
  useGoalsStore: () => ({
    goals: { dailyCalories: 2000 },
  }),
}));

function renderWithTheme() {
  return render(
    <ThemeProvider>
      <NutritionScreen />
    </ThemeProvider>,
  );
}

describe('NutritionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMeals = [];
    mockDailyTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    mockIsLoading = false;
    mockError = null;
    mockLoadMealsForDate.mockResolvedValue(undefined);
    mockLoadDailyTotals.mockResolvedValue(undefined);
    mockDeleteMeal.mockResolvedValue(undefined);
  });

  it('renders empty state when no meals exist', async () => {
    const { findByText } = renderWithTheme();
    await findByText('No meals logged yet');
    await findByText('Tap + to log your food');
  });

  it('renders daily summary card with totals', async () => {
    mockDailyTotals = { calories: 1500, protein: 80, carbs: 200, fat: 50 };
    const { findByText } = renderWithTheme();
    await findByText('1500');
    await findByText('/ 2000 cal');
    await findByText('80g');
    await findByText('200g');
    await findByText('50g');
  });

  it('renders a meal card', async () => {
    const today = new Date().toISOString().split('T')[0];
    mockMeals = [
      {
        id: 'm1',
        date: today,
        mealType: 'breakfast',
        foods: [
          {
            id: 'f1',
            mealId: 'm1',
            name: 'Oatmeal',
            quantity: 1,
            unit: 'bowl',
            calories: 300,
            isAIGenerated: false,
          },
        ],
        totalCalories: 300,
        createdAt: '2026-02-19T00:00:00.000Z',
        updatedAt: '2026-02-19T00:00:00.000Z',
      },
    ];
    const { findByText } = renderWithTheme();
    await findByText('Breakfast');
    await findByText('300 cal');
    await findByText('Oatmeal - 300 cal');
  });

  it('renders multiple meals', async () => {
    const today = new Date().toISOString().split('T')[0];
    mockMeals = [
      {
        id: 'm1',
        date: today,
        mealType: 'breakfast',
        foods: [],
        totalCalories: 300,
        createdAt: '2026-02-19T00:00:00.000Z',
        updatedAt: '2026-02-19T00:00:00.000Z',
      },
      {
        id: 'm2',
        date: today,
        mealType: 'lunch',
        foods: [],
        totalCalories: 500,
        createdAt: '2026-02-19T00:00:00.000Z',
        updatedAt: '2026-02-19T00:00:00.000Z',
      },
    ];
    const { findByText } = renderWithTheme();
    await findByText('Breakfast');
    await findByText('Lunch');
  });

  it('shows error banner when error exists', async () => {
    mockError = 'Failed to load meals';
    const { findByText } = renderWithTheme();
    await findByText('Failed to load meals');
  });

  it('calls loadMealsForDate and loadDailyTotals on mount', async () => {
    renderWithTheme();
    await waitFor(() => {
      expect(mockLoadMealsForDate).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(mockLoadDailyTotals).toHaveBeenCalled();
    });
  });

  it('shows loading skeletons when loading with no meals', async () => {
    mockIsLoading = true;
    mockMeals = [];
    const { queryByText } = renderWithTheme();
    expect(queryByText('No meals logged yet')).toBeNull();
  });

  it('shows section title for meals', async () => {
    const { findByText } = renderWithTheme();
    await findByText("Today's Meals");
  });
});
