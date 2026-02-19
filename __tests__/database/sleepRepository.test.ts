import { sleepRepository } from '@/src/database/repositories';

const mockDb = {
  getAllAsync: jest.fn(),
  getFirstAsync: jest.fn(),
  runAsync: jest.fn(),
};

jest.mock('@/src/database/index', () => ({
  getDatabase: jest.fn(() => Promise.resolve(mockDb)),
}));

jest.mock('@/src/utils/date', () => ({
  ...jest.requireActual('@/src/utils/date'),
  generateId: jest.fn(() => 'test-sleep-id'),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

const makeSleepRow = (overrides = {}) => ({
  id: 's1',
  date: '2026-02-18',
  bedtime: '2026-02-17T22:30:00.000Z',
  wake_time: '2026-02-18T06:30:00.000Z',
  duration_minutes: 480,
  quality: 4,
  notes: null,
  factors: null,
  created_at: '2026-02-18T08:00:00.000Z',
  updated_at: '2026-02-18T08:00:00.000Z',
  ...overrides,
});

describe('sleepRepository', () => {
  describe('getAll', () => {
    it('returns mapped entries ordered by date DESC', async () => {
      mockDb.getAllAsync.mockResolvedValue([makeSleepRow()]);

      const result = await sleepRepository.getAll();

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM sleep_entries ORDER BY date DESC',
      );
      expect(result).toEqual([
        {
          id: 's1',
          date: '2026-02-18',
          bedtime: '2026-02-17T22:30:00.000Z',
          wakeTime: '2026-02-18T06:30:00.000Z',
          durationMinutes: 480,
          quality: 4,
          notes: undefined,
          factors: undefined,
          createdAt: '2026-02-18T08:00:00.000Z',
          updatedAt: '2026-02-18T08:00:00.000Z',
        },
      ]);
    });

    it('maps notes and factors when present', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        makeSleepRow({
          notes: 'Slept well',
          factors: '["caffeine","exercise"]',
        }),
      ]);

      const result = await sleepRepository.getAll();

      expect(result[0].notes).toBe('Slept well');
      expect(result[0].factors).toEqual(['caffeine', 'exercise']);
    });
  });

  describe('getByDate', () => {
    it('returns entry when found', async () => {
      mockDb.getFirstAsync.mockResolvedValue(makeSleepRow());

      const result = await sleepRepository.getByDate('2026-02-18');

      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        'SELECT * FROM sleep_entries WHERE date = ?',
        '2026-02-18',
      );
      expect(result).not.toBeNull();
      expect(result?.id).toBe('s1');
    });

    it('returns null when not found', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await sleepRepository.getByDate('2026-01-01');

      expect(result).toBeNull();
    });
  });

  describe('getByDateRange', () => {
    it('returns entries within date range', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        makeSleepRow({ id: 's1', date: '2026-02-15' }),
        makeSleepRow({ id: 's2', date: '2026-02-18' }),
      ]);

      const result = await sleepRepository.getByDateRange('2026-02-15', '2026-02-18');

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM sleep_entries WHERE date >= ? AND date <= ? ORDER BY date',
        '2026-02-15',
        '2026-02-18',
      );
      expect(result).toHaveLength(2);
    });
  });

  describe('create', () => {
    it('inserts entry and returns with id and timestamps', async () => {
      mockDb.runAsync.mockResolvedValue(undefined);

      const result = await sleepRepository.create({
        date: '2026-02-18',
        bedtime: '2026-02-17T22:00:00.000Z',
        wakeTime: '2026-02-18T06:00:00.000Z',
        durationMinutes: 480,
        quality: 4 as 1 | 2 | 3 | 4 | 5,
      });

      expect(result.id).toBe('test-sleep-id');
      expect(result.date).toBe('2026-02-18');
      expect(result.durationMinutes).toBe(480);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
    });

    it('serializes factors as JSON', async () => {
      mockDb.runAsync.mockResolvedValue(undefined);

      await sleepRepository.create({
        date: '2026-02-18',
        bedtime: '2026-02-17T22:00:00.000Z',
        wakeTime: '2026-02-18T06:00:00.000Z',
        durationMinutes: 480,
        quality: 3 as 1 | 2 | 3 | 4 | 5,
        factors: ['caffeine', 'stress'],
      });

      const args = mockDb.runAsync.mock.calls[0];
      // factors is the 8th positional arg (index 8 in the spread)
      expect(args[8]).toBe('["caffeine","stress"]');
    });
  });

  describe('update', () => {
    it('builds update query with provided fields', async () => {
      mockDb.runAsync.mockResolvedValue(undefined);

      await sleepRepository.update('s1', { quality: 5 as 1 | 2 | 3 | 4 | 5, notes: 'Great' });

      expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
      const [sql] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain('quality = ?');
      expect(sql).toContain('notes = ?');
      expect(sql).toContain('updated_at = ?');
    });

    it('updates all optional fields', async () => {
      mockDb.runAsync.mockResolvedValue(undefined);

      await sleepRepository.update('s1', {
        date: '2026-02-19',
        bedtime: '2026-02-18T23:00:00.000Z',
        wakeTime: '2026-02-19T07:00:00.000Z',
        durationMinutes: 480,
      });

      const [sql] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain('date = ?');
      expect(sql).toContain('bedtime = ?');
      expect(sql).toContain('wake_time = ?');
      expect(sql).toContain('duration_minutes = ?');
    });

    it('serializes factors in update', async () => {
      mockDb.runAsync.mockResolvedValue(undefined);

      await sleepRepository.update('s1', { factors: ['late_meal'] });

      const args = mockDb.runAsync.mock.calls[0];
      expect(args).toContain('["late_meal"]');
    });
  });

  describe('delete', () => {
    it('deletes entry by id', async () => {
      mockDb.runAsync.mockResolvedValue(undefined);

      await sleepRepository.delete('s1');

      expect(mockDb.runAsync).toHaveBeenCalledWith('DELETE FROM sleep_entries WHERE id = ?', 's1');
    });
  });

  describe('getAverageQuality', () => {
    it('returns average quality for date range', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ avg: 3.5 });

      const result = await sleepRepository.getAverageQuality('2026-02-12', '2026-02-18');

      expect(result).toBe(3.5);
    });

    it('returns null when no entries', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ avg: null });

      const result = await sleepRepository.getAverageQuality('2026-01-01', '2026-01-07');

      expect(result).toBeNull();
    });
  });

  describe('getAverageDuration', () => {
    it('returns average duration for date range', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ avg: 450 });

      const result = await sleepRepository.getAverageDuration('2026-02-12', '2026-02-18');

      expect(result).toBe(450);
    });

    it('returns null when no entries', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ avg: null });

      const result = await sleepRepository.getAverageDuration('2026-01-01', '2026-01-07');

      expect(result).toBeNull();
    });
  });
});
