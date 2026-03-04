import { useHabitStore } from './habitStore';
import { useSleepStore } from './sleepStore';
import { useExerciseStore } from './exerciseStore';
import { useNutritionStore } from './nutritionStore';
import { useJournalStore } from './journalStore';
import { useAIInsightsStore } from './aiInsightsStore';
import { useGoalsStore } from './goalsStore';

/** Reset all feature stores to their initial state. Called on sign-out to prevent data leakage. */
export function resetAllStores(): void {
  useHabitStore.setState({
    habits: [],
    todayCompletions: new Map(),
    isLoading: false,
    error: null,
  });
  useSleepStore.setState({ entries: [], isLoading: false, error: null });
  useExerciseStore.setState({ sessions: [], isLoading: false, error: null });
  useNutritionStore.setState({
    meals: [],
    dailyTotals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    isLoading: false,
    isAnalyzing: false,
    error: null,
  });
  useJournalStore.setState({ entries: [], isLoading: false, isScanning: false, error: null });
  useAIInsightsStore.getState().clearAll();
  useGoalsStore.setState({
    goals: {
      sleepHours: 8,
      exerciseMinutesPerWeek: 150,
      dailyCalories: 2000,
      dailyProtein: 50,
      habitsPerDay: 5,
      journalEntriesPerWeek: 3,
    },
    isLoading: false,
  });
}
