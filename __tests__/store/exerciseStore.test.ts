import { useExerciseStore } from '@/src/store/exerciseStore';
import { ExerciseSession } from '@/src/types';

jest.mock('@/src/database/repositories', () => ({
  exerciseRepository: {
    getAll: jest.fn(),
    getByDateRange: jest.fn(),
    getByDate: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getTotalDuration: jest.fn(),
    getTotalCalories: jest.fn(),
  },
}));

const { exerciseRepository } = jest.requireMock('@/src/database/repositories');

const mockSession: ExerciseSession = {
  id: 'e1',
  date: '2026-02-18',
  type: 'running',
  durationMinutes: 45,
  intensity: 'moderate',
  caloriesBurned: 400,
  createdAt: '2026-02-18T08:00:00.000Z',
  updatedAt: '2026-02-18T08:00:00.000Z',
};

function resetStore() {
  useExerciseStore.setState({
    sessions: [],
    isLoading: false,
    error: null,
  });
}

beforeEach(() => {
  resetStore();
  jest.clearAllMocks();
});

describe('exerciseStore', () => {
  describe('initial state', () => {
    it('starts with empty sessions', () => {
      expect(useExerciseStore.getState().sessions).toEqual([]);
    });

    it('starts without error', () => {
      expect(useExerciseStore.getState().error).toBeNull();
    });
  });

  describe('loadSessions', () => {
    it('loads sessions from repository', async () => {
      exerciseRepository.getAll.mockResolvedValue([mockSession]);

      await useExerciseStore.getState().loadSessions();

      expect(useExerciseStore.getState().sessions).toEqual([mockSession]);
      expect(useExerciseStore.getState().isLoading).toBe(false);
    });

    it('sets error on failure', async () => {
      exerciseRepository.getAll.mockRejectedValue(new Error('DB error'));

      await useExerciseStore.getState().loadSessions();

      expect(useExerciseStore.getState().error).toBe('DB error');
    });
  });

  describe('loadSessionsForRange', () => {
    it('loads sessions for date range', async () => {
      exerciseRepository.getByDateRange.mockResolvedValue([mockSession]);

      await useExerciseStore.getState().loadSessionsForRange('2026-02-01', '2026-02-28');

      expect(exerciseRepository.getByDateRange).toHaveBeenCalledWith('2026-02-01', '2026-02-28');
      expect(useExerciseStore.getState().sessions).toEqual([mockSession]);
    });

    it('sets error on failure', async () => {
      exerciseRepository.getByDateRange.mockRejectedValue(new Error('Range error'));

      await useExerciseStore.getState().loadSessionsForRange('2026-02-01', '2026-02-28');

      expect(useExerciseStore.getState().error).toBe('Range error');
      expect(useExerciseStore.getState().isLoading).toBe(false);
    });
  });

  describe('loadSessionsForDate', () => {
    it('delegates to repository', async () => {
      exerciseRepository.getByDate.mockResolvedValue([mockSession]);

      const result = await useExerciseStore.getState().loadSessionsForDate('2026-02-18');

      expect(result).toEqual([mockSession]);
    });
  });

  describe('createSession', () => {
    it('creates session and adds to state', async () => {
      exerciseRepository.create.mockResolvedValue(mockSession);

      const result = await useExerciseStore.getState().createSession({
        date: '2026-02-18',
        type: 'running',
        durationMinutes: 45,
        intensity: 'moderate',
        caloriesBurned: 400,
      });

      expect(result).toEqual(mockSession);
      expect(useExerciseStore.getState().sessions).toContain(mockSession);
    });

    it('sorts sessions by date descending', async () => {
      const olderSession: ExerciseSession = {
        ...mockSession,
        id: 'e0',
        date: '2026-02-17',
      };
      useExerciseStore.setState({ sessions: [olderSession] });
      exerciseRepository.create.mockResolvedValue(mockSession);

      await useExerciseStore.getState().createSession({
        date: '2026-02-18',
        type: 'running',
        durationMinutes: 45,
        intensity: 'moderate',
        caloriesBurned: 400,
      });

      const sessions = useExerciseStore.getState().sessions;
      expect(sessions[0].id).toBe('e1');
      expect(sessions[1].id).toBe('e0');
    });

    it('throws on failure', async () => {
      exerciseRepository.create.mockRejectedValue(new Error('Create failed'));

      await expect(
        useExerciseStore.getState().createSession({
          date: '2026-02-18',
          type: 'running',
          durationMinutes: 45,
          intensity: 'moderate',
        }),
      ).rejects.toThrow('Create failed');
    });
  });

  describe('updateSession', () => {
    it('updates session in state', async () => {
      useExerciseStore.setState({ sessions: [mockSession] });
      exerciseRepository.update.mockResolvedValue(undefined);

      await useExerciseStore.getState().updateSession('e1', { durationMinutes: 60 });

      const updated = useExerciseStore.getState().sessions.find((s) => s.id === 'e1');
      expect(updated?.durationMinutes).toBe(60);
    });

    it('sets error and throws on failure', async () => {
      useExerciseStore.setState({ sessions: [mockSession] });
      exerciseRepository.update.mockRejectedValue(new Error('Update failed'));

      await expect(
        useExerciseStore.getState().updateSession('e1', { durationMinutes: 60 }),
      ).rejects.toThrow('Update failed');

      expect(useExerciseStore.getState().error).toBe('Update failed');
      expect(useExerciseStore.getState().isLoading).toBe(false);
    });
  });

  describe('deleteSession', () => {
    it('removes session from state', async () => {
      useExerciseStore.setState({ sessions: [mockSession] });
      exerciseRepository.delete.mockResolvedValue(undefined);

      await useExerciseStore.getState().deleteSession('e1');

      expect(useExerciseStore.getState().sessions).toEqual([]);
    });

    it('sets error and throws on failure', async () => {
      useExerciseStore.setState({ sessions: [mockSession] });
      exerciseRepository.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(useExerciseStore.getState().deleteSession('e1')).rejects.toThrow(
        'Delete failed',
      );

      expect(useExerciseStore.getState().error).toBe('Delete failed');
      expect(useExerciseStore.getState().isLoading).toBe(false);
    });
  });

  describe('getTotalDuration', () => {
    it('delegates to repository', async () => {
      exerciseRepository.getTotalDuration.mockResolvedValue(120);

      const result = await useExerciseStore.getState().getTotalDuration('2026-02-01', '2026-02-28');

      expect(result).toBe(120);
    });
  });

  describe('getTotalCalories', () => {
    it('delegates to repository', async () => {
      exerciseRepository.getTotalCalories.mockResolvedValue(800);

      const result = await useExerciseStore.getState().getTotalCalories('2026-02-01', '2026-02-28');

      expect(result).toBe(800);
    });
  });

  describe('clearError', () => {
    it('clears error state', () => {
      useExerciseStore.setState({ error: 'something' });

      useExerciseStore.getState().clearError();

      expect(useExerciseStore.getState().error).toBeNull();
    });
  });
});
