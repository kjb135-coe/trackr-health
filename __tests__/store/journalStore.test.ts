import { useJournalStore } from '@/src/store/journalStore';
import { JournalEntry } from '@/src/types';

jest.mock('@/src/database/repositories', () => ({
  journalRepository: {
    getAll: jest.fn(),
    getByDateRange: jest.fn(),
    getByDate: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    search: jest.fn(),
    getAllTags: jest.fn(),
  },
}));

jest.mock('@/src/services/claude', () => ({
  scanHandwrittenJournal: jest.fn(),
}));

const { journalRepository } = jest.requireMock('@/src/database/repositories');
const { scanHandwrittenJournal } = jest.requireMock('@/src/services/claude');

const mockEntry: JournalEntry = {
  id: 'j1',
  date: '2026-02-18',
  title: 'Good day',
  content: 'Had a productive day at work.',
  mood: 4,
  tags: ['work', 'productive'],
  isScanned: false,
  createdAt: '2026-02-18T20:00:00.000Z',
  updatedAt: '2026-02-18T20:00:00.000Z',
};

const mockEntry2: JournalEntry = {
  ...mockEntry,
  id: 'j2',
  date: '2026-02-17',
  title: 'Quiet evening',
  content: 'Relaxed after a long day.',
  mood: 3,
};

function resetStore() {
  useJournalStore.setState({
    entries: [],
    isLoading: false,
    isScanning: false,
    error: null,
  });
}

beforeEach(() => {
  resetStore();
  jest.clearAllMocks();
});

describe('journalStore', () => {
  describe('initial state', () => {
    it('starts with empty entries', () => {
      expect(useJournalStore.getState().entries).toEqual([]);
    });

    it('starts without error', () => {
      expect(useJournalStore.getState().error).toBeNull();
    });

    it('starts not loading', () => {
      expect(useJournalStore.getState().isLoading).toBe(false);
      expect(useJournalStore.getState().isScanning).toBe(false);
    });
  });

  describe('loadEntries', () => {
    it('loads entries from repository', async () => {
      journalRepository.getAll.mockResolvedValue([mockEntry, mockEntry2]);

      await useJournalStore.getState().loadEntries();

      expect(useJournalStore.getState().entries).toEqual([mockEntry, mockEntry2]);
      expect(useJournalStore.getState().isLoading).toBe(false);
    });

    it('sets error on failure', async () => {
      journalRepository.getAll.mockRejectedValue(new Error('DB error'));

      await useJournalStore.getState().loadEntries();

      expect(useJournalStore.getState().error).toBe('DB error');
      expect(useJournalStore.getState().isLoading).toBe(false);
    });
  });

  describe('loadEntriesForRange', () => {
    it('loads entries for date range', async () => {
      journalRepository.getByDateRange.mockResolvedValue([mockEntry]);

      await useJournalStore.getState().loadEntriesForRange('2026-02-01', '2026-02-28');

      expect(journalRepository.getByDateRange).toHaveBeenCalledWith('2026-02-01', '2026-02-28');
      expect(useJournalStore.getState().entries).toEqual([mockEntry]);
    });

    it('sets error on failure', async () => {
      journalRepository.getByDateRange.mockRejectedValue(new Error('Range error'));

      await useJournalStore.getState().loadEntriesForRange('2026-02-01', '2026-02-28');

      expect(useJournalStore.getState().error).toBe('Range error');
    });
  });

  describe('loadEntriesForDate', () => {
    it('delegates to repository', async () => {
      journalRepository.getByDate.mockResolvedValue([mockEntry]);

      const result = await useJournalStore.getState().loadEntriesForDate('2026-02-18');

      expect(journalRepository.getByDate).toHaveBeenCalledWith('2026-02-18');
      expect(result).toEqual([mockEntry]);
    });
  });

  describe('createEntry', () => {
    it('creates entry and adds to state sorted by date', async () => {
      useJournalStore.setState({ entries: [mockEntry2] });
      journalRepository.create.mockResolvedValue(mockEntry);

      const result = await useJournalStore.getState().createEntry({
        date: '2026-02-18',
        title: 'Good day',
        content: 'Had a productive day at work.',
        mood: 4,
        tags: ['work', 'productive'],
        isScanned: false,
      });

      expect(result).toEqual(mockEntry);
      const entries = useJournalStore.getState().entries;
      expect(entries[0].id).toBe('j1'); // newer date first
      expect(entries[1].id).toBe('j2');
    });

    it('throws on failure and sets error', async () => {
      journalRepository.create.mockRejectedValue(new Error('Create failed'));

      await expect(
        useJournalStore.getState().createEntry({
          date: '2026-02-18',
          title: 'Test',
          content: 'Test content',
          isScanned: false,
        }),
      ).rejects.toThrow('Create failed');

      expect(useJournalStore.getState().error).toBe('Create failed');
    });
  });

  describe('updateEntry', () => {
    it('updates entry in state', async () => {
      useJournalStore.setState({ entries: [mockEntry] });
      journalRepository.update.mockResolvedValue(undefined);

      await useJournalStore.getState().updateEntry('j1', { title: 'Updated title' });

      const updated = useJournalStore.getState().entries[0];
      expect(updated.title).toBe('Updated title');
      expect(useJournalStore.getState().isLoading).toBe(false);
    });

    it('throws on failure', async () => {
      useJournalStore.setState({ entries: [mockEntry] });
      journalRepository.update.mockRejectedValue(new Error('Update failed'));

      await expect(useJournalStore.getState().updateEntry('j1', { title: 'New' })).rejects.toThrow(
        'Update failed',
      );

      expect(useJournalStore.getState().error).toBe('Update failed');
    });
  });

  describe('deleteEntry', () => {
    it('removes entry from state', async () => {
      useJournalStore.setState({ entries: [mockEntry, mockEntry2] });
      journalRepository.delete.mockResolvedValue(undefined);

      await useJournalStore.getState().deleteEntry('j1');

      expect(useJournalStore.getState().entries).toEqual([mockEntry2]);
    });

    it('throws on failure', async () => {
      useJournalStore.setState({ entries: [mockEntry] });
      journalRepository.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(useJournalStore.getState().deleteEntry('j1')).rejects.toThrow('Delete failed');
    });
  });

  describe('search', () => {
    it('delegates to repository', async () => {
      journalRepository.search.mockResolvedValue([mockEntry]);

      const result = await useJournalStore.getState().search('productive');

      expect(journalRepository.search).toHaveBeenCalledWith('productive');
      expect(result).toEqual([mockEntry]);
    });
  });

  describe('scanImage', () => {
    it('scans image and returns OCR result', async () => {
      const ocrResult = {
        text: 'Handwritten text',
        confidence: 0.95,
        processingTimeMs: 1200,
        rawResponse: '{}',
      };
      scanHandwrittenJournal.mockResolvedValue(ocrResult);

      const result = await useJournalStore.getState().scanImage('/path/to/image.jpg');

      expect(result).toEqual(ocrResult);
      expect(useJournalStore.getState().isScanning).toBe(false);
    });

    it('sets error on scan failure', async () => {
      scanHandwrittenJournal.mockRejectedValue(new Error('OCR failed'));

      await expect(useJournalStore.getState().scanImage('/path/to/image.jpg')).rejects.toThrow(
        'OCR failed',
      );

      expect(useJournalStore.getState().error).toBe('OCR failed');
      expect(useJournalStore.getState().isScanning).toBe(false);
    });
  });

  describe('getAllTags', () => {
    it('delegates to repository', async () => {
      journalRepository.getAllTags.mockResolvedValue(['work', 'fitness', 'mood']);

      const result = await useJournalStore.getState().getAllTags();

      expect(result).toEqual(['work', 'fitness', 'mood']);
    });
  });

  describe('clearError', () => {
    it('clears error state', () => {
      useJournalStore.setState({ error: 'something went wrong' });

      useJournalStore.getState().clearError();

      expect(useJournalStore.getState().error).toBeNull();
    });
  });
});
