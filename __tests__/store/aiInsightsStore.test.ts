import { useAIInsightsStore } from '@/src/store';
import { act } from '@testing-library/react-native';

const mockGenerateDailyCoaching = jest.fn();
const mockGenerateHabitSuggestions = jest.fn();
const mockAnalyzeSleepPatterns = jest.fn();
const mockGetExerciseRecommendation = jest.fn();
const mockAnalyzeJournalMood = jest.fn();
const mockGetNutritionAdvice = jest.fn();

jest.mock('@/src/services/ai', () => ({
  generateDailyCoaching: (...args: unknown[]) => mockGenerateDailyCoaching(...args),
  generateHabitSuggestions: (...args: unknown[]) => mockGenerateHabitSuggestions(...args),
  analyzeSleepPatterns: (...args: unknown[]) => mockAnalyzeSleepPatterns(...args),
  getExerciseRecommendation: (...args: unknown[]) => mockGetExerciseRecommendation(...args),
  analyzeJournalMood: (...args: unknown[]) => mockAnalyzeJournalMood(...args),
  getNutritionAdvice: (...args: unknown[]) => mockGetNutritionAdvice(...args),
}));

beforeEach(() => {
  jest.clearAllMocks();
  // Reset store state
  act(() => {
    useAIInsightsStore.getState().clearAll();
  });
});

describe('aiInsightsStore', () => {
  describe('fetchDailyCoaching', () => {
    it('fetches coaching and stores result', async () => {
      const mockCoaching = {
        greeting: 'Good morning!',
        insights: ['Great sleep!'],
        suggestion: 'Try yoga',
        motivationalQuote: 'Keep going!',
      };
      mockGenerateDailyCoaching.mockResolvedValue(mockCoaching);

      await act(async () => {
        await useAIInsightsStore.getState().fetchDailyCoaching();
      });

      const state = useAIInsightsStore.getState();
      expect(state.dailyCoaching).toEqual(mockCoaching);
      expect(state.isLoadingCoaching).toBe(false);
      expect(state.lastCoachingFetch).not.toBeNull();
    });

    it('uses cache if data is fresh', async () => {
      const mockCoaching = { greeting: 'Hello' };
      mockGenerateDailyCoaching.mockResolvedValue(mockCoaching);

      // First fetch
      await act(async () => {
        await useAIInsightsStore.getState().fetchDailyCoaching();
      });

      // Second fetch — should use cache
      await act(async () => {
        await useAIInsightsStore.getState().fetchDailyCoaching();
      });

      expect(mockGenerateDailyCoaching).toHaveBeenCalledTimes(1);
    });

    it('sets error on failure', async () => {
      mockGenerateDailyCoaching.mockRejectedValue(new Error('API timeout'));

      await act(async () => {
        await useAIInsightsStore.getState().fetchDailyCoaching();
      });

      const state = useAIInsightsStore.getState();
      expect(state.dailyCoaching).toBeNull();
      expect(state.isLoadingCoaching).toBe(false);
      expect(state.error).toBe('API timeout');
    });

    it('sets generic error for non-Error throws', async () => {
      mockGenerateDailyCoaching.mockRejectedValue('string error');

      await act(async () => {
        await useAIInsightsStore.getState().fetchDailyCoaching();
      });

      expect(useAIInsightsStore.getState().error).toBe('string error');
    });
  });

  describe('fetchHabitSuggestions', () => {
    it('fetches suggestions and stores result', async () => {
      const mockSuggestions = [{ name: 'Meditate', reason: 'Reduce stress', frequency: 'daily' }];
      mockGenerateHabitSuggestions.mockResolvedValue(mockSuggestions);

      await act(async () => {
        await useAIInsightsStore.getState().fetchHabitSuggestions();
      });

      expect(useAIInsightsStore.getState().habitSuggestions).toEqual(mockSuggestions);
      expect(useAIInsightsStore.getState().isLoadingHabits).toBe(false);
    });

    it('sets error on failure', async () => {
      mockGenerateHabitSuggestions.mockRejectedValue(new Error('Failed'));

      await act(async () => {
        await useAIInsightsStore.getState().fetchHabitSuggestions();
      });

      expect(useAIInsightsStore.getState().error).toBe('Failed');
    });
  });

  describe('fetchSleepAnalysis', () => {
    it('fetches analysis and stores result', async () => {
      const mockAnalysis = {
        pattern: 'Consistent bedtime',
        qualityTrend: 'improving',
        optimalBedtime: '22:30',
        recommendations: ['Avoid caffeine'],
      };
      mockAnalyzeSleepPatterns.mockResolvedValue(mockAnalysis);

      await act(async () => {
        await useAIInsightsStore.getState().fetchSleepAnalysis();
      });

      expect(useAIInsightsStore.getState().sleepAnalysis).toEqual(mockAnalysis);
    });

    it('sets error on failure', async () => {
      mockAnalyzeSleepPatterns.mockRejectedValue(new Error('Sleep error'));

      await act(async () => {
        await useAIInsightsStore.getState().fetchSleepAnalysis();
      });

      expect(useAIInsightsStore.getState().error).toBe('Sleep error');
      expect(useAIInsightsStore.getState().isLoadingSleep).toBe(false);
    });
  });

  describe('fetchExerciseRecommendation', () => {
    it('fetches recommendation and stores result', async () => {
      const mockRec = {
        type: 'Running',
        duration: 30,
        intensity: 'moderate',
        targetCalories: 300,
        reason: 'Balance your routine',
      };
      mockGetExerciseRecommendation.mockResolvedValue(mockRec);

      await act(async () => {
        await useAIInsightsStore.getState().fetchExerciseRecommendation();
      });

      expect(useAIInsightsStore.getState().exerciseRecommendation).toEqual(mockRec);
    });

    it('sets error on failure', async () => {
      mockGetExerciseRecommendation.mockRejectedValue(new Error('Exercise error'));

      await act(async () => {
        await useAIInsightsStore.getState().fetchExerciseRecommendation();
      });

      expect(useAIInsightsStore.getState().error).toBe('Exercise error');
      expect(useAIInsightsStore.getState().isLoadingExercise).toBe(false);
    });
  });

  describe('fetchMoodAnalysis', () => {
    it('fetches mood analysis and stores result', async () => {
      const mockMood = {
        overallMood: 'positive',
        trend: 'stable',
        insights: ['Generally upbeat'],
      };
      mockAnalyzeJournalMood.mockResolvedValue(mockMood);

      await act(async () => {
        await useAIInsightsStore.getState().fetchMoodAnalysis();
      });

      expect(useAIInsightsStore.getState().moodAnalysis).toEqual(mockMood);
    });

    it('sets error on failure', async () => {
      mockAnalyzeJournalMood.mockRejectedValue(new Error('Mood error'));

      await act(async () => {
        await useAIInsightsStore.getState().fetchMoodAnalysis();
      });

      expect(useAIInsightsStore.getState().error).toBe('Mood error');
      expect(useAIInsightsStore.getState().isLoadingMood).toBe(false);
    });
  });

  describe('fetchNutritionAdvice', () => {
    it('fetches nutrition advice and stores result', async () => {
      const mockAdvice = {
        advice: 'Increase protein intake',
        suggestions: ['Add eggs to breakfast', 'Snack on nuts'],
      };
      mockGetNutritionAdvice.mockResolvedValue(mockAdvice);

      await act(async () => {
        await useAIInsightsStore.getState().fetchNutritionAdvice();
      });

      expect(useAIInsightsStore.getState().nutritionAdvice).toEqual(mockAdvice);
    });

    it('sets error on failure', async () => {
      mockGetNutritionAdvice.mockRejectedValue(new Error('No data'));

      await act(async () => {
        await useAIInsightsStore.getState().fetchNutritionAdvice();
      });

      expect(useAIInsightsStore.getState().error).toBe('No data');
      expect(useAIInsightsStore.getState().isLoadingNutrition).toBe(false);
    });
  });

  describe('clearAll', () => {
    it('resets all state to initial values', async () => {
      const mockCoaching = { greeting: 'Hello' };
      mockGenerateDailyCoaching.mockResolvedValue(mockCoaching);

      await act(async () => {
        await useAIInsightsStore.getState().fetchDailyCoaching();
      });

      expect(useAIInsightsStore.getState().dailyCoaching).not.toBeNull();

      act(() => {
        useAIInsightsStore.getState().clearAll();
      });

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
