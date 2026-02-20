import { useGoalsStore } from '@/src/store/goalsStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const DEFAULT_GOALS = {
  sleepHours: 8,
  exerciseMinutesPerWeek: 150,
  dailyCalories: 2000,
  dailyProtein: 50,
  habitsPerDay: 5,
  journalEntriesPerWeek: 3,
};

function resetStore() {
  useGoalsStore.setState({
    goals: DEFAULT_GOALS,
    isLoading: false,
  });
}

beforeEach(() => {
  resetStore();
  jest.clearAllMocks();
});

describe('goalsStore', () => {
  describe('initial state', () => {
    it('starts with default goals', () => {
      expect(useGoalsStore.getState().goals).toEqual(DEFAULT_GOALS);
    });

    it('starts not loading', () => {
      expect(useGoalsStore.getState().isLoading).toBe(false);
    });
  });

  describe('loadGoals', () => {
    it('loads goals from AsyncStorage', async () => {
      const storedGoals = { sleepHours: 7, dailyCalories: 2500 };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(storedGoals));

      await useGoalsStore.getState().loadGoals();

      expect(useGoalsStore.getState().goals).toEqual({
        ...DEFAULT_GOALS,
        sleepHours: 7,
        dailyCalories: 2500,
      });
      expect(useGoalsStore.getState().isLoading).toBe(false);
    });

    it('uses defaults when no stored data', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      await useGoalsStore.getState().loadGoals();

      expect(useGoalsStore.getState().goals).toEqual(DEFAULT_GOALS);
    });

    it('handles AsyncStorage errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await useGoalsStore.getState().loadGoals();

      expect(useGoalsStore.getState().goals).toEqual(DEFAULT_GOALS);
      expect(useGoalsStore.getState().isLoading).toBe(false);
    });
  });

  describe('updateGoals', () => {
    it('updates goals in state and persists', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await useGoalsStore.getState().updateGoals({ sleepHours: 9 });

      expect(useGoalsStore.getState().goals.sleepHours).toBe(9);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'trackr_goals',
        expect.stringContaining('"sleepHours":9'),
      );
    });

    it('merges partial updates with existing goals', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await useGoalsStore.getState().updateGoals({ dailyProtein: 80 });

      const goals = useGoalsStore.getState().goals;
      expect(goals.dailyProtein).toBe(80);
      expect(goals.sleepHours).toBe(8); // unchanged
    });

    it('handles storage errors gracefully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Write error'));

      await useGoalsStore.getState().updateGoals({ sleepHours: 7 });

      // Goals still updated in memory even if storage fails
      expect(useGoalsStore.getState().goals.sleepHours).toBe(7);
    });
  });
});
