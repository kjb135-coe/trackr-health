import { useHabitStore } from '@/src/store/habitStore';
import { Habit, HabitCompletion } from '@/src/types';

jest.mock('@/src/database/repositories', () => ({
  habitRepository: {
    getAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getCompletionsForDate: jest.fn(),
    setCompletion: jest.fn(),
    getStreak: jest.fn(),
    getAllStreaks: jest.fn(),
    getCompletionsForDateRange: jest.fn(),
  },
}));

const { habitRepository } = jest.requireMock('@/src/database/repositories');

const mockHabit: Habit = {
  id: '1',
  name: 'Read daily',
  color: '#FF6B6B',
  frequency: 'daily',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockCompletion: HabitCompletion = {
  id: 'c1',
  habitId: '1',
  date: '2026-02-18',
  completed: true,
  completedAt: '2026-02-18T10:00:00.000Z',
};

function resetStore() {
  useHabitStore.setState({
    habits: [],
    todayCompletions: new Map(),
    isLoading: false,
    error: null,
  });
}

beforeEach(() => {
  resetStore();
  jest.clearAllMocks();
});

describe('habitStore', () => {
  describe('initial state', () => {
    it('has empty habits array', () => {
      expect(useHabitStore.getState().habits).toEqual([]);
    });

    it('has empty completions map', () => {
      expect(useHabitStore.getState().todayCompletions.size).toBe(0);
    });

    it('has no error', () => {
      expect(useHabitStore.getState().error).toBeNull();
    });

    it('is not loading', () => {
      expect(useHabitStore.getState().isLoading).toBe(false);
    });
  });

  describe('loadHabits', () => {
    it('loads habits from repository', async () => {
      habitRepository.getAll.mockResolvedValue([mockHabit]);

      await useHabitStore.getState().loadHabits();

      expect(useHabitStore.getState().habits).toEqual([mockHabit]);
      expect(useHabitStore.getState().isLoading).toBe(false);
      expect(useHabitStore.getState().error).toBeNull();
    });

    it('sets loading state during fetch', async () => {
      let resolvePromise: (value: Habit[]) => void;
      habitRepository.getAll.mockReturnValue(
        new Promise<Habit[]>((resolve) => {
          resolvePromise = resolve;
        }),
      );

      const loadPromise = useHabitStore.getState().loadHabits();
      expect(useHabitStore.getState().isLoading).toBe(true);

      resolvePromise!([]);
      await loadPromise;
      expect(useHabitStore.getState().isLoading).toBe(false);
    });

    it('sets error on failure', async () => {
      habitRepository.getAll.mockRejectedValue(new Error('DB error'));

      await useHabitStore.getState().loadHabits();

      expect(useHabitStore.getState().error).toBe('DB error');
      expect(useHabitStore.getState().isLoading).toBe(false);
    });
  });

  describe('createHabit', () => {
    it('creates a habit and adds it to state', async () => {
      habitRepository.create.mockResolvedValue(mockHabit);

      const result = await useHabitStore.getState().createHabit({
        name: 'Read daily',
        color: '#FF6B6B',
        frequency: 'daily',
      });

      expect(result).toEqual(mockHabit);
      expect(useHabitStore.getState().habits).toContain(mockHabit);
    });

    it('prepends new habit to list', async () => {
      const existingHabit = { ...mockHabit, id: '0', name: 'Existing' };
      useHabitStore.setState({ habits: [existingHabit] });

      habitRepository.create.mockResolvedValue(mockHabit);
      await useHabitStore.getState().createHabit({
        name: 'Read daily',
        color: '#FF6B6B',
        frequency: 'daily',
      });

      expect(useHabitStore.getState().habits[0]).toEqual(mockHabit);
      expect(useHabitStore.getState().habits[1]).toEqual(existingHabit);
    });

    it('throws and sets error on failure', async () => {
      habitRepository.create.mockRejectedValue(new Error('Create failed'));

      await expect(
        useHabitStore.getState().createHabit({
          name: 'Test',
          color: '#000',
          frequency: 'daily',
        }),
      ).rejects.toThrow('Create failed');

      expect(useHabitStore.getState().error).toBe('Create failed');
    });
  });

  describe('deleteHabit', () => {
    it('removes habit from state', async () => {
      useHabitStore.setState({ habits: [mockHabit] });
      habitRepository.delete.mockResolvedValue(undefined);

      await useHabitStore.getState().deleteHabit('1');

      expect(useHabitStore.getState().habits).toEqual([]);
    });

    it('throws on failure', async () => {
      useHabitStore.setState({ habits: [mockHabit] });
      habitRepository.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(useHabitStore.getState().deleteHabit('1')).rejects.toThrow('Delete failed');

      expect(useHabitStore.getState().error).toBe('Delete failed');
      expect(useHabitStore.getState().isLoading).toBe(false);
    });
  });

  describe('updateHabit', () => {
    it('updates habit in state', async () => {
      useHabitStore.setState({ habits: [mockHabit] });
      habitRepository.update.mockResolvedValue(undefined);

      await useHabitStore.getState().updateHabit('1', { name: 'Read 30 min' });

      expect(useHabitStore.getState().habits[0].name).toBe('Read 30 min');
    });

    it('sets error and throws on failure', async () => {
      useHabitStore.setState({ habits: [mockHabit] });
      habitRepository.update.mockRejectedValue(new Error('Update failed'));

      await expect(useHabitStore.getState().updateHabit('1', { name: 'fail' })).rejects.toThrow(
        'Update failed',
      );

      expect(useHabitStore.getState().error).toBe('Update failed');
      expect(useHabitStore.getState().isLoading).toBe(false);
    });
  });

  describe('loadTodayCompletions', () => {
    it('loads completions into a map', async () => {
      habitRepository.getCompletionsForDate.mockResolvedValue([mockCompletion]);

      await useHabitStore.getState().loadTodayCompletions();

      const map = useHabitStore.getState().todayCompletions;
      expect(map.get('1')).toEqual(mockCompletion);
    });

    it('silently fails on error', async () => {
      habitRepository.getCompletionsForDate.mockRejectedValue(new Error('fail'));

      await useHabitStore.getState().loadTodayCompletions();

      expect(useHabitStore.getState().todayCompletions.size).toBe(0);
      expect(useHabitStore.getState().error).toBeNull();
    });
  });

  describe('toggleCompletion', () => {
    it('toggles from incomplete to complete', async () => {
      habitRepository.setCompletion.mockResolvedValue(mockCompletion);

      await useHabitStore.getState().toggleCompletion('1');

      expect(habitRepository.setCompletion).toHaveBeenCalledWith('1', expect.any(String), true);
    });

    it('toggles from complete to incomplete', async () => {
      const completionMap = new Map<string, HabitCompletion>();
      completionMap.set('1', mockCompletion);
      useHabitStore.setState({ todayCompletions: completionMap });

      const uncompleted = { ...mockCompletion, completed: false };
      habitRepository.setCompletion.mockResolvedValue(uncompleted);

      await useHabitStore.getState().toggleCompletion('1');

      expect(habitRepository.setCompletion).toHaveBeenCalledWith('1', expect.any(String), false);
    });
  });

  describe('getStreak', () => {
    it('delegates to repository', async () => {
      habitRepository.getStreak.mockResolvedValue(7);

      const streak = await useHabitStore.getState().getStreak('1');

      expect(streak).toBe(7);
      expect(habitRepository.getStreak).toHaveBeenCalledWith('1');
    });
  });

  describe('getAllStreaks', () => {
    it('delegates to repository with habit ids', async () => {
      useHabitStore.setState({ habits: [mockHabit] });
      const streakMap = new Map([['1', 5]]);
      habitRepository.getAllStreaks.mockResolvedValue(streakMap);

      const result = await useHabitStore.getState().getAllStreaks();

      expect(result).toEqual(streakMap);
      expect(habitRepository.getAllStreaks).toHaveBeenCalledWith(['1']);
    });
  });

  describe('getWeeklyCompletions', () => {
    it('returns map of habit completions for the week', async () => {
      habitRepository.getCompletionsForDateRange.mockResolvedValue([
        { habitId: '1', date: '2026-02-18', completed: true },
        { habitId: '1', date: '2026-02-17', completed: true },
        { habitId: '1', date: '2026-02-16', completed: false },
      ]);

      const result = await useHabitStore.getState().getWeeklyCompletions('2026-02-18');

      expect(result.get('1')?.has('2026-02-18')).toBe(true);
      expect(result.get('1')?.has('2026-02-17')).toBe(true);
      // completed: false should not be included
      expect(result.get('1')?.has('2026-02-16')).toBeFalsy();
      expect(habitRepository.getCompletionsForDateRange).toHaveBeenCalledWith(
        '2026-02-12',
        '2026-02-18',
      );
    });
  });

  describe('clearError', () => {
    it('clears the error state', () => {
      useHabitStore.setState({ error: 'some error' });

      useHabitStore.getState().clearError();

      expect(useHabitStore.getState().error).toBeNull();
    });
  });
});
