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
  date: '2026-02-19',
  content: 'Today was a great day.',
  title: 'A Good Day',
  mood: 4,
  tags: ['personal', 'gratitude'],
  isScanned: false,
  createdAt: '2026-02-19T20:00:00.000Z',
  updatedAt: '2026-02-19T20:00:00.000Z',
};

const mockEntry2: JournalEntry = {
  id: 'j2',
  date: '2026-02-18',
  content: 'Worked on the project all day.',
  title: 'Productive',
  mood: 3,
  tags: ['work'],
  isScanned: false,
  createdAt: '2026-02-18T20:00:00.000Z',
  updatedAt: '2026-02-18T20:00:00.000Z',
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
    });

    it('starts not scanning', () => {
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

      await useJournalStore.getState().loadEntriesForRange('2026-02-19', '2026-02-19');

      expect(journalRepository.getByDateRange).toHaveBeenCalledWith('2026-02-19', '2026-02-19');
      expect(useJournalStore.getState().entries).toEqual([mockEntry]);
    });
  });

  describe('createEntry', () => {
    it('creates entry and adds to state sorted by date', async () => {
      useJournalStore.setState({ entries: [mockEntry] });
      journalRepository.create.mockResolvedValue(mockEntry2);

      const result = await useJournalStore.getState().createEntry({
        date: mockEntry2.date,
        content: mockEntry2.content,
        title: mockEntry2.title,
        mood: mockEntry2.mood,
        tags: mockEntry2.tags,
        isScanned: false,
      });

      expect(result).toEqual(mockEntry2);
      const entries = useJournalStore.getState().entries;
      // Sorted by date descending: mockEntry (02-19) before mockEntry2 (02-18)
      expect(entries[0].id).toBe('j1');
      expect(entries[1].id).toBe('j2');
    });

    it('sets error on failure', async () => {
      journalRepository.create.mockRejectedValue(new Error('Create failed'));

      await expect(
        useJournalStore.getState().createEntry({
          date: '2026-02-19',
          content: 'Test',
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

      await useJournalStore.getState().updateEntry('j1', { title: 'Updated Title' });

      expect(useJournalStore.getState().entries[0].title).toBe('Updated Title');
    });
  });

  describe('deleteEntry', () => {
    it('removes entry from state', async () => {
      useJournalStore.setState({ entries: [mockEntry, mockEntry2] });
      journalRepository.delete.mockResolvedValue(undefined);

      await useJournalStore.getState().deleteEntry('j1');

      expect(useJournalStore.getState().entries).toHaveLength(1);
      expect(useJournalStore.getState().entries[0].id).toBe('j2');
    });

    it('sets error on failure', async () => {
      journalRepository.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(useJournalStore.getState().deleteEntry('j1')).rejects.toThrow('Delete failed');
      expect(useJournalStore.getState().error).toBe('Delete failed');
    });
  });

  describe('search', () => {
    it('delegates to repository', async () => {
      journalRepository.search.mockResolvedValue([mockEntry]);

      const results = await useJournalStore.getState().search('great day');

      expect(journalRepository.search).toHaveBeenCalledWith('great day');
      expect(results).toEqual([mockEntry]);
    });
  });

  describe('scanImage', () => {
    it('scans image and returns OCR result', async () => {
      const ocrResult = { text: 'Handwritten text', confidence: 0.95 };
      scanHandwrittenJournal.mockResolvedValue(ocrResult);

      const result = await useJournalStore.getState().scanImage('file:///photo.jpg');

      expect(scanHandwrittenJournal).toHaveBeenCalledWith('file:///photo.jpg');
      expect(result).toEqual(ocrResult);
      expect(useJournalStore.getState().isScanning).toBe(false);
    });

    it('sets error on scan failure', async () => {
      scanHandwrittenJournal.mockRejectedValue(new Error('Scan failed'));

      await expect(useJournalStore.getState().scanImage('file:///photo.jpg')).rejects.toThrow(
        'Scan failed',
      );

      expect(useJournalStore.getState().error).toBe('Scan failed');
      expect(useJournalStore.getState().isScanning).toBe(false);
    });
  });

  describe('getAllTags', () => {
    it('delegates to repository', async () => {
      journalRepository.getAllTags.mockResolvedValue(['personal', 'work']);

      const tags = await useJournalStore.getState().getAllTags();

      expect(tags).toEqual(['personal', 'work']);
    });
  });

  describe('clearError', () => {
    it('clears error state', () => {
      useJournalStore.setState({ error: 'Some error' });

      useJournalStore.getState().clearError();

      expect(useJournalStore.getState().error).toBeNull();
    });
  });
});
