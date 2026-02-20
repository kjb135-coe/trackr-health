import { useAIInsightsStore } from '@/src/store/aiInsightsStore';

jest.mock('@/src/services/ai', () => ({
  generateDailyCoaching: jest.fn(),
  generateHabitSuggestions: jest.fn(),
  analyzeSleepPatterns: jest.fn(),
  getExerciseRecommendation: jest.fn(),
  analyzeJournalMood: jest.fn(),
  getNutritionAdvice: jest.fn(),
}));

const {
  generateDailyCoaching,
  generateHabitSuggestions,
  analyzeSleepPatterns,
  getExerciseRecommendation,
  analyzeJournalMood,
  getNutritionAdvice,
} = jest.requireMock('@/src/services/ai');

const mockCoaching = {
  greeting: 'Good morning!',
  insights: [],
  dailyTip: 'Stay hydrated',
  motivationalMessage: 'Keep going!',
};

function resetStore() {
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
    error: null,
    lastCoachingFetch: null,
  });
}

beforeEach(() => {
  resetStore();
  jest.clearAllMocks();
});

describe('aiInsightsStore', () => {
  describe('initial state', () => {
    it('starts with null data and no loading', () => {
      const state = useAIInsightsStore.getState();
      expect(state.dailyCoaching).toBeNull();
      expect(state.habitSuggestions).toEqual([]);
      expect(state.isLoadingCoaching).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('fetchDailyCoaching', () => {
    it('fetches and stores coaching data', async () => {
      generateDailyCoaching.mockResolvedValue(mockCoaching);

      await useAIInsightsStore.getState().fetchDailyCoaching();

      const state = useAIInsightsStore.getState();
      expect(state.dailyCoaching).toEqual(mockCoaching);
      expect(state.isLoadingCoaching).toBe(false);
      expect(state.lastCoachingFetch).not.toBeNull();
    });

    it('uses cache when data is fresh', async () => {
      generateDailyCoaching.mockResolvedValue(mockCoaching);

      // First call fetches
      await useAIInsightsStore.getState().fetchDailyCoaching();
      expect(generateDailyCoaching).toHaveBeenCalledTimes(1);

      // Second call uses cache
      await useAIInsightsStore.getState().fetchDailyCoaching();
      expect(generateDailyCoaching).toHaveBeenCalledTimes(1);
    });

    it('refetches when cache is expired', async () => {
      generateDailyCoaching.mockResolvedValue(mockCoaching);

      await useAIInsightsStore.getState().fetchDailyCoaching();

      // Expire cache
      useAIInsightsStore.setState({ lastCoachingFetch: Date.now() - 2 * 60 * 60 * 1000 });

      await useAIInsightsStore.getState().fetchDailyCoaching();
      expect(generateDailyCoaching).toHaveBeenCalledTimes(2);
    });

    it('sets error on failure', async () => {
      generateDailyCoaching.mockRejectedValue(new Error('API error'));

      await useAIInsightsStore.getState().fetchDailyCoaching();

      expect(useAIInsightsStore.getState().error).toBe('API error');
      expect(useAIInsightsStore.getState().isLoadingCoaching).toBe(false);
    });
  });

  describe('fetchHabitSuggestions', () => {
    it('fetches and stores suggestions', async () => {
      const suggestions = [
        {
          name: 'Meditate',
          description: 'Daily meditation',
          frequency: 'daily',
          reason: 'Reduce stress',
        },
      ];
      generateHabitSuggestions.mockResolvedValue(suggestions);

      await useAIInsightsStore.getState().fetchHabitSuggestions();

      expect(useAIInsightsStore.getState().habitSuggestions).toEqual(suggestions);
      expect(useAIInsightsStore.getState().isLoadingHabits).toBe(false);
    });

    it('sets error on failure', async () => {
      generateHabitSuggestions.mockRejectedValue(new Error('Suggestions failed'));

      await useAIInsightsStore.getState().fetchHabitSuggestions();

      expect(useAIInsightsStore.getState().error).toBe('Suggestions failed');
    });
  });

  describe('fetchSleepAnalysis', () => {
    it('fetches and stores analysis', async () => {
      const analysis = {
        pattern: 'Regular',
        qualityTrend: 'improving',
        recommendations: ['Sleep more'],
        optimalBedtime: '10:30 PM',
      };
      analyzeSleepPatterns.mockResolvedValue(analysis);

      await useAIInsightsStore.getState().fetchSleepAnalysis();

      expect(useAIInsightsStore.getState().sleepAnalysis).toEqual(analysis);
    });

    it('sets error on failure', async () => {
      analyzeSleepPatterns.mockRejectedValue(new Error('Sleep analysis failed'));

      await useAIInsightsStore.getState().fetchSleepAnalysis();

      expect(useAIInsightsStore.getState().error).toBe('Sleep analysis failed');
    });
  });

  describe('fetchExerciseRecommendation', () => {
    it('fetches and stores recommendation', async () => {
      const rec = {
        type: 'Running',
        duration: 30,
        intensity: 'medium',
        reason: 'Good day for it',
        targetCalories: 300,
      };
      getExerciseRecommendation.mockResolvedValue(rec);

      await useAIInsightsStore.getState().fetchExerciseRecommendation();

      expect(useAIInsightsStore.getState().exerciseRecommendation).toEqual(rec);
    });
  });

  describe('fetchMoodAnalysis', () => {
    it('fetches and stores mood analysis', async () => {
      const mood = {
        overallMood: 'Positive',
        commonThemes: ['work'],
        moodTrend: 'stable',
        suggestions: ['Keep journaling'],
      };
      analyzeJournalMood.mockResolvedValue(mood);

      await useAIInsightsStore.getState().fetchMoodAnalysis();

      expect(useAIInsightsStore.getState().moodAnalysis).toEqual(mood);
    });
  });

  describe('fetchNutritionAdvice', () => {
    it('fetches and stores nutrition advice', async () => {
      const advice = { advice: 'Eat more protein', suggestions: ['Add eggs', 'Try lentils'] };
      getNutritionAdvice.mockResolvedValue(advice);

      await useAIInsightsStore.getState().fetchNutritionAdvice();

      expect(useAIInsightsStore.getState().nutritionAdvice).toEqual(advice);
    });

    it('sets error on failure', async () => {
      getNutritionAdvice.mockRejectedValue(new Error('Nutrition failed'));

      await useAIInsightsStore.getState().fetchNutritionAdvice();

      expect(useAIInsightsStore.getState().error).toBe('Nutrition failed');
    });
  });

  describe('clearAll', () => {
    it('resets all data and cache', async () => {
      generateDailyCoaching.mockResolvedValue(mockCoaching);
      await useAIInsightsStore.getState().fetchDailyCoaching();

      useAIInsightsStore.getState().clearAll();

      const state = useAIInsightsStore.getState();
      expect(state.dailyCoaching).toBeNull();
      expect(state.habitSuggestions).toEqual([]);
      expect(state.sleepAnalysis).toBeNull();
      expect(state.exerciseRecommendation).toBeNull();
      expect(state.moodAnalysis).toBeNull();
      expect(state.nutritionAdvice).toBeNull();
      expect(state.lastCoachingFetch).toBeNull();
      expect(state.error).toBeNull();
    });
  });
});
