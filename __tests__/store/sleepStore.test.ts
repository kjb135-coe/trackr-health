import { useSleepStore } from '@/src/store/sleepStore';
import { SleepEntry } from '@/src/types';

jest.mock('@/src/database/repositories', () => ({
  sleepRepository: {
    getAll: jest.fn(),
    getByDateRange: jest.fn(),
    getByDate: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getAverageQuality: jest.fn(),
    getAverageDuration: jest.fn(),
  },
}));

const { sleepRepository } = jest.requireMock('@/src/database/repositories');

const mockEntry: SleepEntry = {
  id: 's1',
  date: '2026-02-18',
  bedtime: '2026-02-17T23:00:00.000Z',
  wakeTime: '2026-02-18T07:00:00.000Z',
  durationMinutes: 480,
  quality: 4,
  createdAt: '2026-02-18T07:30:00.000Z',
  updatedAt: '2026-02-18T07:30:00.000Z',
};

function resetStore() {
  useSleepStore.setState({
    entries: [],
    isLoading: false,
    error: null,
  });
}

beforeEach(() => {
  resetStore();
  jest.clearAllMocks();
});

describe('sleepStore', () => {
  describe('initial state', () => {
    it('starts with empty entries', () => {
      expect(useSleepStore.getState().entries).toEqual([]);
    });

    it('starts without error', () => {
      expect(useSleepStore.getState().error).toBeNull();
    });
  });

  describe('loadEntries', () => {
    it('loads entries from repository', async () => {
      sleepRepository.getAll.mockResolvedValue([mockEntry]);

      await useSleepStore.getState().loadEntries();

      expect(useSleepStore.getState().entries).toEqual([mockEntry]);
      expect(useSleepStore.getState().isLoading).toBe(false);
    });

    it('sets error on failure', async () => {
      sleepRepository.getAll.mockRejectedValue(new Error('DB error'));

      await useSleepStore.getState().loadEntries();

      expect(useSleepStore.getState().error).toBe('DB error');
    });
  });

  describe('loadEntriesForRange', () => {
    it('loads entries for date range', async () => {
      sleepRepository.getByDateRange.mockResolvedValue([mockEntry]);

      await useSleepStore.getState().loadEntriesForRange('2026-02-01', '2026-02-28');

      expect(sleepRepository.getByDateRange).toHaveBeenCalledWith('2026-02-01', '2026-02-28');
      expect(useSleepStore.getState().entries).toEqual([mockEntry]);
    });

    it('sets error on failure', async () => {
      sleepRepository.getByDateRange.mockRejectedValue(new Error('Range error'));

      await useSleepStore.getState().loadEntriesForRange('2026-02-01', '2026-02-28');

      expect(useSleepStore.getState().error).toBe('Range error');
      expect(useSleepStore.getState().isLoading).toBe(false);
    });
  });

  describe('createEntry', () => {
    it('creates entry and sorts by date descending', async () => {
      const olderEntry = { ...mockEntry, id: 's0', date: '2026-02-16' };
      useSleepStore.setState({ entries: [olderEntry] });
      sleepRepository.create.mockResolvedValue(mockEntry);

      const result = await useSleepStore.getState().createEntry({
        date: '2026-02-18',
        bedtime: '2026-02-17T23:00:00.000Z',
        wakeTime: '2026-02-18T07:00:00.000Z',
        durationMinutes: 480,
        quality: 4,
      });

      expect(result).toEqual(mockEntry);
      const entries = useSleepStore.getState().entries;
      expect(entries[0].date).toBe('2026-02-18');
      expect(entries[1].date).toBe('2026-02-16');
    });

    it('throws on failure', async () => {
      sleepRepository.create.mockRejectedValue(new Error('Create failed'));

      await expect(
        useSleepStore.getState().createEntry({
          date: '2026-02-18',
          bedtime: '2026-02-17T23:00:00.000Z',
          wakeTime: '2026-02-18T07:00:00.000Z',
          durationMinutes: 480,
          quality: 4,
        }),
      ).rejects.toThrow('Create failed');
    });
  });

  describe('updateEntry', () => {
    it('updates only the matching entry in state', async () => {
      const otherEntry = { ...mockEntry, id: 's2', quality: 3 as const };
      useSleepStore.setState({ entries: [mockEntry, otherEntry] });
      sleepRepository.update.mockResolvedValue(undefined);

      await useSleepStore.getState().updateEntry('s1', { quality: 5 });

      const entries = useSleepStore.getState().entries;
      expect(entries.find((e) => e.id === 's1')?.quality).toBe(5);
      expect(entries.find((e) => e.id === 's2')?.quality).toBe(3);
      expect(useSleepStore.getState().isLoading).toBe(false);
    });

    it('sets error on failure', async () => {
      useSleepStore.setState({ entries: [mockEntry] });
      sleepRepository.update.mockRejectedValue(new Error('Update failed'));

      await expect(useSleepStore.getState().updateEntry('s1', { quality: 5 })).rejects.toThrow(
        'Update failed',
      );

      expect(useSleepStore.getState().error).toBe('Update failed');
      expect(useSleepStore.getState().isLoading).toBe(false);
    });
  });

  describe('deleteEntry', () => {
    it('removes entry from state', async () => {
      useSleepStore.setState({ entries: [mockEntry] });
      sleepRepository.delete.mockResolvedValue(undefined);

      await useSleepStore.getState().deleteEntry('s1');

      expect(useSleepStore.getState().entries).toEqual([]);
    });

    it('sets error on failure', async () => {
      useSleepStore.setState({ entries: [mockEntry] });
      sleepRepository.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(useSleepStore.getState().deleteEntry('s1')).rejects.toThrow('Delete failed');

      expect(useSleepStore.getState().error).toBe('Delete failed');
      expect(useSleepStore.getState().isLoading).toBe(false);
    });
  });

  describe('getEntryByDate', () => {
    it('delegates to repository', async () => {
      sleepRepository.getByDate.mockResolvedValue(mockEntry);

      const result = await useSleepStore.getState().getEntryByDate('2026-02-18');

      expect(result).toEqual(mockEntry);
    });
  });

  describe('getAverageQuality', () => {
    it('delegates to repository', async () => {
      sleepRepository.getAverageQuality.mockResolvedValue(3.5);

      const result = await useSleepStore.getState().getAverageQuality('2026-02-01', '2026-02-28');

      expect(result).toBe(3.5);
    });
  });

  describe('getAverageDuration', () => {
    it('delegates to repository', async () => {
      sleepRepository.getAverageDuration.mockResolvedValue(450);

      const result = await useSleepStore.getState().getAverageDuration('2026-02-01', '2026-02-28');

      expect(result).toBe(450);
    });
  });

  describe('clearError', () => {
    it('clears error state', () => {
      useSleepStore.setState({ error: 'something' });

      useSleepStore.getState().clearError();

      expect(useSleepStore.getState().error).toBeNull();
    });
  });
});
