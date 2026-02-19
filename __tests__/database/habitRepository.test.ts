import { habitRepository } from '@/src/database/repositories';

const mockDb = {
  getAllAsync: jest.fn(),
  getFirstAsync: jest.fn(),
  runAsync: jest.fn(),
};

jest.mock('@/src/database/index', () => ({
  getDatabase: jest.fn(() => Promise.resolve(mockDb)),
}));

jest.mock('@/src/utils/date', () => ({
  generateId: jest.fn(() => 'test-id'),
  getDateString: jest.fn((date?: Date) => {
    const d = date || new Date();
    return d.toISOString().split('T')[0];
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('habitRepository', () => {
  describe('getAll', () => {
    it('returns mapped habits ordered by created_at DESC', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        {
          id: 'h1',
          name: 'Exercise',
          description: null,
          icon: null,
          color: '#FF0000',
          frequency: 'daily',
          target_days_per_week: null,
          reminder_time: null,
          created_at: '2026-02-18T08:00:00.000Z',
          updated_at: '2026-02-18T08:00:00.000Z',
        },
      ]);

      const result = await habitRepository.getAll();

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM habits ORDER BY created_at DESC',
      );
      expect(result).toEqual([
        {
          id: 'h1',
          name: 'Exercise',
          description: undefined,
          icon: undefined,
          color: '#FF0000',
          frequency: 'daily',
          targetDaysPerWeek: undefined,
          reminderTime: undefined,
          createdAt: '2026-02-18T08:00:00.000Z',
          updatedAt: '2026-02-18T08:00:00.000Z',
        },
      ]);
    });

    it('maps null fields to undefined', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        {
          id: 'h1',
          name: 'Read',
          description: 'Read 30 min',
          icon: '📖',
          color: '#00FF00',
          frequency: 'weekly',
          target_days_per_week: 5,
          reminder_time: '09:00',
          created_at: '2026-02-18T08:00:00.000Z',
          updated_at: '2026-02-18T08:00:00.000Z',
        },
      ]);

      const result = await habitRepository.getAll();

      expect(result[0].description).toBe('Read 30 min');
      expect(result[0].icon).toBe('📖');
      expect(result[0].targetDaysPerWeek).toBe(5);
      expect(result[0].reminderTime).toBe('09:00');
    });
  });

  describe('getById', () => {
    it('returns mapped habit when found', async () => {
      mockDb.getFirstAsync.mockResolvedValue({
        id: 'h1',
        name: 'Exercise',
        description: null,
        icon: null,
        color: '#FF0000',
        frequency: 'daily',
        target_days_per_week: null,
        reminder_time: null,
        created_at: '2026-02-18T08:00:00.000Z',
        updated_at: '2026-02-18T08:00:00.000Z',
      });

      const result = await habitRepository.getById('h1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('h1');
    });

    it('returns null when not found', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await habitRepository.getById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('inserts habit and returns with id and timestamps', async () => {
      mockDb.runAsync.mockResolvedValue(undefined);

      const result = await habitRepository.create({
        name: 'Meditate',
        color: '#9B59B6',
        frequency: 'daily',
      });

      expect(result.id).toBe('test-id');
      expect(result.name).toBe('Meditate');
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('builds update query with provided fields', async () => {
      mockDb.runAsync.mockResolvedValue(undefined);

      await habitRepository.update('h1', { name: 'New Name', color: '#000' });

      expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
      const [sql] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain('name = ?');
      expect(sql).toContain('color = ?');
      expect(sql).toContain('updated_at = ?');
    });
  });

  describe('delete', () => {
    it('deletes habit by id', async () => {
      mockDb.runAsync.mockResolvedValue(undefined);

      await habitRepository.delete('h1');

      expect(mockDb.runAsync).toHaveBeenCalledWith('DELETE FROM habits WHERE id = ?', 'h1');
    });
  });

  describe('getCompletionsForDate', () => {
    it('returns mapped completions for date', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        {
          id: 'c1',
          habit_id: 'h1',
          date: '2026-02-18',
          completed: 1,
          completed_at: '2026-02-18T10:00:00.000Z',
          notes: null,
        },
      ]);

      const result = await habitRepository.getCompletionsForDate('2026-02-18');

      expect(result).toEqual([
        {
          id: 'c1',
          habitId: 'h1',
          date: '2026-02-18',
          completed: true,
          completedAt: '2026-02-18T10:00:00.000Z',
          notes: undefined,
        },
      ]);
    });

    it('maps completed=0 to false', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        {
          id: 'c1',
          habit_id: 'h1',
          date: '2026-02-18',
          completed: 0,
          completed_at: null,
          notes: null,
        },
      ]);

      const result = await habitRepository.getCompletionsForDate('2026-02-18');

      expect(result[0].completed).toBe(false);
      expect(result[0].completedAt).toBeUndefined();
    });
  });

  describe('setCompletion', () => {
    it('upserts completion record', async () => {
      mockDb.runAsync.mockResolvedValue(undefined);

      const result = await habitRepository.setCompletion('h1', '2026-02-18', true);

      expect(result.habitId).toBe('h1');
      expect(result.date).toBe('2026-02-18');
      expect(result.completed).toBe(true);
      expect(result.completedAt).toBeDefined();
      const [sql] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain('ON CONFLICT');
    });

    it('sets completedAt to null when marking incomplete', async () => {
      mockDb.runAsync.mockResolvedValue(undefined);

      const result = await habitRepository.setCompletion('h1', '2026-02-18', false);

      expect(result.completed).toBe(false);
      expect(result.completedAt).toBeUndefined();
    });
  });

  describe('getStreak', () => {
    it('counts consecutive completed days', async () => {
      mockDb.getFirstAsync
        .mockResolvedValueOnce({ completed: 1 })
        .mockResolvedValueOnce({ completed: 1 })
        .mockResolvedValueOnce({ completed: 0 });

      const result = await habitRepository.getStreak('h1');

      expect(result).toBe(2);
    });

    it('returns 0 when no completions', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await habitRepository.getStreak('h1');

      expect(result).toBe(0);
    });
  });
});
