import { exerciseRepository } from '@/src/database/repositories';

const mockDb = {
  getAllAsync: jest.fn(),
  getFirstAsync: jest.fn(),
  runAsync: jest.fn(),
};

jest.mock('@/src/database/index', () => ({
  getDatabase: jest.fn(() => Promise.resolve(mockDb)),
}));

jest.mock('@/src/utils/date', () => ({
  generateId: jest.fn(() => 'test-exercise-id'),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

const makeExerciseRow = (overrides = {}) => ({
  id: 'e1',
  date: '2026-02-18',
  type: 'running',
  custom_type: null,
  duration_minutes: 45,
  intensity: 'moderate',
  calories_burned: 350,
  notes: null,
  heart_rate_avg: null,
  heart_rate_max: null,
  distance: null,
  distance_unit: null,
  created_at: '2026-02-18T08:00:00.000Z',
  updated_at: '2026-02-18T08:00:00.000Z',
  ...overrides,
});

describe('exerciseRepository', () => {
  describe('getAll', () => {
    it('returns mapped sessions ordered by date DESC', async () => {
      mockDb.getAllAsync.mockResolvedValue([makeExerciseRow()]);

      const result = await exerciseRepository.getAll();

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM exercise_sessions ORDER BY date DESC, created_at DESC',
      );
      expect(result).toEqual([
        {
          id: 'e1',
          date: '2026-02-18',
          type: 'running',
          customType: undefined,
          durationMinutes: 45,
          intensity: 'moderate',
          caloriesBurned: 350,
          notes: undefined,
          heartRateAvg: undefined,
          heartRateMax: undefined,
          distance: undefined,
          distanceUnit: undefined,
          createdAt: '2026-02-18T08:00:00.000Z',
          updatedAt: '2026-02-18T08:00:00.000Z',
        },
      ]);
    });

    it('maps optional fields when present', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        makeExerciseRow({
          custom_type: 'Rock Climbing',
          notes: 'Hard session',
          heart_rate_avg: 145,
          heart_rate_max: 178,
          distance: 5.2,
          distance_unit: 'km',
        }),
      ]);

      const result = await exerciseRepository.getAll();

      expect(result[0].customType).toBe('Rock Climbing');
      expect(result[0].notes).toBe('Hard session');
      expect(result[0].heartRateAvg).toBe(145);
      expect(result[0].heartRateMax).toBe(178);
      expect(result[0].distance).toBe(5.2);
      expect(result[0].distanceUnit).toBe('km');
    });
  });

  describe('getById', () => {
    it('returns session when found', async () => {
      mockDb.getFirstAsync.mockResolvedValue(makeExerciseRow());

      const result = await exerciseRepository.getById('e1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('e1');
      expect(result?.type).toBe('running');
    });

    it('returns null when not found', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await exerciseRepository.getById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getByDate', () => {
    it('returns sessions for specific date', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        makeExerciseRow({ id: 'e1' }),
        makeExerciseRow({ id: 'e2', type: 'yoga' }),
      ]);

      const result = await exerciseRepository.getByDate('2026-02-18');

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM exercise_sessions WHERE date = ? ORDER BY created_at',
        '2026-02-18',
      );
      expect(result).toHaveLength(2);
    });
  });

  describe('getByDateRange', () => {
    it('returns sessions within date range', async () => {
      mockDb.getAllAsync.mockResolvedValue([makeExerciseRow()]);

      const result = await exerciseRepository.getByDateRange('2026-02-12', '2026-02-18');

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM exercise_sessions WHERE date >= ? AND date <= ? ORDER BY date, created_at',
        '2026-02-12',
        '2026-02-18',
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('inserts session and returns with id and timestamps', async () => {
      mockDb.runAsync.mockResolvedValue(undefined);

      const result = await exerciseRepository.create({
        date: '2026-02-18',
        type: 'cycling',
        durationMinutes: 60,
        intensity: 'high',
        caloriesBurned: 500,
      });

      expect(result.id).toBe('test-exercise-id');
      expect(result.type).toBe('cycling');
      expect(result.durationMinutes).toBe(60);
      expect(result.createdAt).toBeDefined();
      expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('builds update query with provided fields', async () => {
      mockDb.runAsync.mockResolvedValue(undefined);

      await exerciseRepository.update('e1', { durationMinutes: 90, intensity: 'high' });

      const [sql] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain('duration_minutes = ?');
      expect(sql).toContain('intensity = ?');
      expect(sql).toContain('updated_at = ?');
    });
  });

  describe('delete', () => {
    it('deletes session by id', async () => {
      mockDb.runAsync.mockResolvedValue(undefined);

      await exerciseRepository.delete('e1');

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'DELETE FROM exercise_sessions WHERE id = ?',
        'e1',
      );
    });
  });

  describe('getTotalDuration', () => {
    it('returns sum of duration for date range', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ total: 180 });

      const result = await exerciseRepository.getTotalDuration('2026-02-12', '2026-02-18');

      expect(result).toBe(180);
    });

    it('returns 0 when no sessions', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ total: null });

      const result = await exerciseRepository.getTotalDuration('2026-01-01', '2026-01-07');

      expect(result).toBe(0);
    });
  });

  describe('getTotalCalories', () => {
    it('returns sum of calories for date range', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ total: 1200 });

      const result = await exerciseRepository.getTotalCalories('2026-02-12', '2026-02-18');

      expect(result).toBe(1200);
    });

    it('returns 0 when no sessions', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ total: null });

      const result = await exerciseRepository.getTotalCalories('2026-01-01', '2026-01-07');

      expect(result).toBe(0);
    });
  });
});
