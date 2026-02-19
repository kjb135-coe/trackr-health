import { useGoalsStore } from '@/src/store/goalsStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const mockedStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

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
    goals: { ...DEFAULT_GOALS },
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
      mockedStorage.getItem.mockResolvedValue(
        JSON.stringify({ sleepHours: 7, dailyCalories: 2500 }),
      );

      await useGoalsStore.getState().loadGoals();

      const goals = useGoalsStore.getState().goals;
      expect(goals.sleepHours).toBe(7);
      expect(goals.dailyCalories).toBe(2500);
      // Other values should be defaults
      expect(goals.exerciseMinutesPerWeek).toBe(150);
      expect(goals.dailyProtein).toBe(50);
    });

    it('uses defaults when nothing stored', async () => {
      mockedStorage.getItem.mockResolvedValue(null);

      await useGoalsStore.getState().loadGoals();

      expect(useGoalsStore.getState().goals).toEqual(DEFAULT_GOALS);
    });

    it('uses defaults on storage error', async () => {
      mockedStorage.getItem.mockRejectedValue(new Error('Storage error'));

      await useGoalsStore.getState().loadGoals();

      expect(useGoalsStore.getState().goals).toEqual(DEFAULT_GOALS);
      expect(useGoalsStore.getState().isLoading).toBe(false);
    });

    it('sets isLoading during load', async () => {
      let resolvePromise: (value: string | null) => void;
      mockedStorage.getItem.mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = resolve;
        }),
      );

      const loadPromise = useGoalsStore.getState().loadGoals();
      expect(useGoalsStore.getState().isLoading).toBe(true);

      resolvePromise!(null);
      await loadPromise;
      expect(useGoalsStore.getState().isLoading).toBe(false);
    });
  });

  describe('updateGoals', () => {
    it('updates goals in state', async () => {
      mockedStorage.setItem.mockResolvedValue(undefined);

      await useGoalsStore.getState().updateGoals({ sleepHours: 9 });

      expect(useGoalsStore.getState().goals.sleepHours).toBe(9);
      // Other values preserved
      expect(useGoalsStore.getState().goals.dailyCalories).toBe(2000);
    });

    it('persists to AsyncStorage', async () => {
      mockedStorage.setItem.mockResolvedValue(undefined);

      await useGoalsStore.getState().updateGoals({ dailyProtein: 80 });

      expect(mockedStorage.setItem).toHaveBeenCalledWith(
        'trackr_goals',
        expect.stringContaining('"dailyProtein":80'),
      );
    });

    it('updates state even if storage fails', async () => {
      mockedStorage.setItem.mockRejectedValue(new Error('Storage error'));

      await useGoalsStore.getState().updateGoals({ sleepHours: 6 });

      // State updated even though persist failed
      expect(useGoalsStore.getState().goals.sleepHours).toBe(6);
    });

    it('merges partial updates', async () => {
      mockedStorage.setItem.mockResolvedValue(undefined);

      await useGoalsStore.getState().updateGoals({ sleepHours: 7, dailyCalories: 1800 });

      const goals = useGoalsStore.getState().goals;
      expect(goals.sleepHours).toBe(7);
      expect(goals.dailyCalories).toBe(1800);
      expect(goals.exerciseMinutesPerWeek).toBe(150);
      expect(goals.habitsPerDay).toBe(5);
    });
  });
});
