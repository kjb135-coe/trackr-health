import { create } from 'zustand';
import {
  generateDailyCoaching,
  generateHabitSuggestions,
  analyzeSleepPatterns,
  getExerciseRecommendation,
  analyzeJournalMood,
  getNutritionAdvice,
  DailyAICoaching,
  HabitSuggestion,
  SleepAnalysis,
  ExerciseRecommendation,
  MoodAnalysis,
} from '@/src/services/ai';

interface AIInsightsState {
  // Data
  dailyCoaching: DailyAICoaching | null;
  habitSuggestions: HabitSuggestion[];
  sleepAnalysis: SleepAnalysis | null;
  exerciseRecommendation: ExerciseRecommendation | null;
  moodAnalysis: MoodAnalysis | null;
  nutritionAdvice: { advice: string; suggestions: string[] } | null;

  // Loading states
  isLoadingCoaching: boolean;
  isLoadingHabits: boolean;
  isLoadingSleep: boolean;
  isLoadingExercise: boolean;
  isLoadingMood: boolean;
  isLoadingNutrition: boolean;

  // Error states
  error: string | null;

  // Cache timestamps
  lastCoachingFetch: number | null;

  // Actions
  fetchDailyCoaching: () => Promise<void>;
  fetchHabitSuggestions: () => Promise<void>;
  fetchSleepAnalysis: () => Promise<void>;
  fetchExerciseRecommendation: () => Promise<void>;
  fetchMoodAnalysis: () => Promise<void>;
  fetchNutritionAdvice: () => Promise<void>;
  clearAll: () => void;
}

// Cache duration: 1 hour
const CACHE_DURATION = 60 * 60 * 1000;

export const useAIInsightsStore = create<AIInsightsState>((set, get) => ({
  // Initial state
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

  error: null,
  lastCoachingFetch: null,

  fetchDailyCoaching: async () => {
    const { lastCoachingFetch, dailyCoaching } = get();

    // Use cache if fresh
    if (dailyCoaching && lastCoachingFetch && Date.now() - lastCoachingFetch < CACHE_DURATION) {
      return;
    }

    set({ isLoadingCoaching: true, error: null });
    try {
      const coaching = await generateDailyCoaching();
      set({
        dailyCoaching: coaching,
        isLoadingCoaching: false,
        lastCoachingFetch: Date.now(),
      });
    } catch (error) {
      set({
        isLoadingCoaching: false,
        error: error instanceof Error ? error.message : 'Failed to load AI coaching',
      });
    }
  },

  fetchHabitSuggestions: async () => {
    set({ isLoadingHabits: true, error: null });
    try {
      const suggestions = await generateHabitSuggestions();
      set({ habitSuggestions: suggestions, isLoadingHabits: false });
    } catch (error) {
      set({
        isLoadingHabits: false,
        error: error instanceof Error ? error.message : 'Failed to load habit suggestions',
      });
    }
  },

  fetchSleepAnalysis: async () => {
    set({ isLoadingSleep: true, error: null });
    try {
      const analysis = await analyzeSleepPatterns();
      set({ sleepAnalysis: analysis, isLoadingSleep: false });
    } catch (error) {
      set({
        isLoadingSleep: false,
        error: error instanceof Error ? error.message : 'Failed to analyze sleep',
      });
    }
  },

  fetchExerciseRecommendation: async () => {
    set({ isLoadingExercise: true, error: null });
    try {
      const recommendation = await getExerciseRecommendation();
      set({ exerciseRecommendation: recommendation, isLoadingExercise: false });
    } catch (error) {
      set({
        isLoadingExercise: false,
        error: error instanceof Error ? error.message : 'Failed to get exercise recommendation',
      });
    }
  },

  fetchMoodAnalysis: async () => {
    set({ isLoadingMood: true, error: null });
    try {
      const analysis = await analyzeJournalMood();
      set({ moodAnalysis: analysis, isLoadingMood: false });
    } catch (error) {
      set({
        isLoadingMood: false,
        error: error instanceof Error ? error.message : 'Failed to analyze mood',
      });
    }
  },

  fetchNutritionAdvice: async () => {
    set({ isLoadingNutrition: true, error: null });
    try {
      const advice = await getNutritionAdvice();
      set({ nutritionAdvice: advice, isLoadingNutrition: false });
    } catch (error) {
      set({
        isLoadingNutrition: false,
        error: error instanceof Error ? error.message : 'Failed to get nutrition advice',
      });
    }
  },

  clearAll: () => {
    set({
      dailyCoaching: null,
      habitSuggestions: [],
      sleepAnalysis: null,
      exerciseRecommendation: null,
      moodAnalysis: null,
      nutritionAdvice: null,
      lastCoachingFetch: null,
      error: null,
    });
  },
}));
