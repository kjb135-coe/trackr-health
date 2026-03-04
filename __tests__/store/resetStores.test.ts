import { resetAllStores } from '@/src/store/resetStores';
import { useHabitStore } from '@/src/store/habitStore';
import { useSleepStore } from '@/src/store/sleepStore';
import { useExerciseStore } from '@/src/store/exerciseStore';
import { useNutritionStore } from '@/src/store/nutritionStore';
import { useJournalStore } from '@/src/store/journalStore';
import { useAIInsightsStore } from '@/src/store/aiInsightsStore';
import { useGoalsStore, DEFAULT_GOALS } from '@/src/store/goalsStore';

jest.mock('@/src/database/repositories', () => ({}));
jest.mock('@/src/services/ai', () => ({}));
jest.mock('@/src/services/claude', () => ({}));

describe('resetAllStores', () => {
  it('resets all feature stores to initial state', () => {
    // Simulate dirty state
    useHabitStore.setState({ habits: [{ id: '1' }] as never[], error: 'err' });
    useSleepStore.setState({ entries: [{ id: '1' }] as never[], error: 'err' });
    useExerciseStore.setState({ sessions: [{ id: '1' }] as never[], error: 'err' });
    useNutritionStore.setState({
      meals: [{ id: '1' }] as never[],
      dailyTotals: { calories: 500, protein: 20, carbs: 50, fat: 10 },
      error: 'err',
    });
    useJournalStore.setState({ entries: [{ id: '1' }] as never[], error: 'err' });
    useAIInsightsStore.setState({
      dailyCoaching: { greeting: 'Hi' } as never,
      isLoadingCoaching: true,
      error: 'err',
    });
    useGoalsStore.setState({ goals: { ...DEFAULT_GOALS, sleepHours: 10 } });

    resetAllStores();

    expect(useHabitStore.getState().habits).toEqual([]);
    expect(useHabitStore.getState().error).toBeNull();
    expect(useSleepStore.getState().entries).toEqual([]);
    expect(useExerciseStore.getState().sessions).toEqual([]);
    expect(useNutritionStore.getState().meals).toEqual([]);
    expect(useNutritionStore.getState().dailyTotals.calories).toBe(0);
    expect(useJournalStore.getState().entries).toEqual([]);
    expect(useAIInsightsStore.getState().dailyCoaching).toBeNull();
    expect(useAIInsightsStore.getState().isLoadingCoaching).toBe(false);
    expect(useAIInsightsStore.getState().error).toBeNull();
    expect(useGoalsStore.getState().goals.sleepHours).toBe(DEFAULT_GOALS.sleepHours);
  });
});
