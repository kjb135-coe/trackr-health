import { useHabitStore } from './habitStore';
import { useSleepStore } from './sleepStore';
import { useExerciseStore } from './exerciseStore';
import { useNutritionStore } from './nutritionStore';
import { useJournalStore } from './journalStore';
import { useAIInsightsStore } from './aiInsightsStore';
import { useGoalsStore, DEFAULT_GOALS } from './goalsStore';
import { clearAllImages } from '@/src/utils/imagePersist';

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
  useAIInsightsStore.setState({
    dailyCoaching: null,
    habitSuggestions: [],
    sleepAnalysis: null,
    exerciseRecommendation: null,
    moodAnalysis: null,
    nutritionAdvice: null,
    isLoadingCoaching: false,
    isLoadingHabits: false,
    isLoadingSleep: false,
    isLoadingExercise: false,
    isLoadingMood: false,
    isLoadingNutrition: false,
    lastCoachingFetch: null,
    error: null,
  });
  useGoalsStore.setState({ goals: { ...DEFAULT_GOALS }, isLoading: false });
  clearAllImages();
}
