import { journalRepository } from '@/src/database/repositories';

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
  generateId: jest.fn(() => 'test-journal-id'),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

const makeJournalRow = (overrides = {}) => ({
  id: 'j1',
  date: '2026-02-18',
  title: 'My Day',
  content: 'Had a great day today.',
  mood: 4,
  tags: '["gratitude","reflection"]',
  is_scanned: 0,
  original_image_uri: null,
  ocr_confidence: null,
  created_at: '2026-02-18T20:00:00.000Z',
  updated_at: '2026-02-18T20:00:00.000Z',
  ...overrides,
});

describe('journalRepository', () => {
  describe('getAll', () => {
    it('returns mapped entries ordered by date DESC', async () => {
      mockDb.getAllAsync.mockResolvedValue([makeJournalRow()]);

      const result = await journalRepository.getAll();

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM journal_entries ORDER BY date DESC, created_at DESC',
      );
      expect(result).toEqual([
        {
          id: 'j1',
          date: '2026-02-18',
          title: 'My Day',
          content: 'Had a great day today.',
          mood: 4,
          tags: ['gratitude', 'reflection'],
          isScanned: false,
          originalImageUri: undefined,
          ocrConfidence: undefined,
          createdAt: '2026-02-18T20:00:00.000Z',
          updatedAt: '2026-02-18T20:00:00.000Z',
        },
      ]);
    });

    it('maps null fields to undefined', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        makeJournalRow({ title: null, mood: null, tags: null }),
      ]);

      const result = await journalRepository.getAll();

      expect(result[0].title).toBeUndefined();
      expect(result[0].mood).toBeUndefined();
      expect(result[0].tags).toBeUndefined();
    });

    it('maps scanned entries correctly', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        makeJournalRow({
          is_scanned: 1,
          original_image_uri: 'file:///images/scan.jpg',
          ocr_confidence: 0.95,
        }),
      ]);

      const result = await journalRepository.getAll();

      expect(result[0].isScanned).toBe(true);
      expect(result[0].originalImageUri).toBe('file:///images/scan.jpg');
      expect(result[0].ocrConfidence).toBe(0.95);
    });
  });

  describe('getById', () => {
    it('returns entry when found', async () => {
      mockDb.getFirstAsync.mockResolvedValue(makeJournalRow());

      const result = await journalRepository.getById('j1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('j1');
    });

    it('returns null when not found', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await journalRepository.getById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getByDate', () => {
    it('returns entries for specific date', async () => {
      mockDb.getAllAsync.mockResolvedValue([makeJournalRow()]);

      const result = await journalRepository.getByDate('2026-02-18');

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM journal_entries WHERE date = ? ORDER BY created_at DESC',
        '2026-02-18',
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('getByDateRange', () => {
    it('returns entries within date range', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        makeJournalRow({ id: 'j1', date: '2026-02-15' }),
        makeJournalRow({ id: 'j2', date: '2026-02-18' }),
      ]);

      const result = await journalRepository.getByDateRange('2026-02-15', '2026-02-18');

      expect(result).toHaveLength(2);
    });
  });

  describe('search', () => {
    it('searches content and title with LIKE pattern', async () => {
      mockDb.getAllAsync.mockResolvedValue([makeJournalRow()]);

      const result = await journalRepository.search('great');

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('WHERE content LIKE ? OR title LIKE ?'),
        '%great%',
        '%great%',
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('inserts entry and returns with id and timestamps', async () => {
      mockDb.runAsync.mockResolvedValue(undefined);

      const result = await journalRepository.create({
        date: '2026-02-18',
        content: 'Test entry',
        isScanned: false,
      });

      expect(result.id).toBe('test-journal-id');
      expect(result.content).toBe('Test entry');
      expect(result.isScanned).toBe(false);
      expect(result.createdAt).toBeDefined();
      expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
    });

    it('serializes tags as JSON', async () => {
      mockDb.runAsync.mockResolvedValue(undefined);

      await journalRepository.create({
        date: '2026-02-18',
        content: 'Tagged entry',
        tags: ['work', 'ideas'],
        isScanned: false,
      });

      const args = mockDb.runAsync.mock.calls[0];
      expect(args).toContain('["work","ideas"]');
    });
  });

  describe('update', () => {
    it('builds update query with provided fields', async () => {
      mockDb.runAsync.mockResolvedValue(undefined);

      await journalRepository.update('j1', { content: 'Updated', mood: 5 });

      const [sql] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain('content = ?');
      expect(sql).toContain('mood = ?');
      expect(sql).toContain('updated_at = ?');
    });

    it('updates all optional fields', async () => {
      mockDb.runAsync.mockResolvedValue(undefined);

      await journalRepository.update('j1', {
        date: '2026-02-19',
        title: 'New Title',
        isScanned: true,
        originalImageUri: 'file:///image.jpg',
        ocrConfidence: 0.95,
      });

      const [sql] = mockDb.runAsync.mock.calls[0];
      expect(sql).toContain('date = ?');
      expect(sql).toContain('title = ?');
      expect(sql).toContain('is_scanned = ?');
      expect(sql).toContain('original_image_uri = ?');
      expect(sql).toContain('ocr_confidence = ?');
    });

    it('serializes tags in update', async () => {
      mockDb.runAsync.mockResolvedValue(undefined);

      await journalRepository.update('j1', { tags: ['new-tag'] });

      const args = mockDb.runAsync.mock.calls[0];
      expect(args).toContain('["new-tag"]');
    });
  });

  describe('delete', () => {
    it('deletes entry by id', async () => {
      mockDb.runAsync.mockResolvedValue(undefined);

      await journalRepository.delete('j1');

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'DELETE FROM journal_entries WHERE id = ?',
        'j1',
      );
    });
  });

  describe('getEntriesWithMood', () => {
    it('returns entries with mood in date range', async () => {
      mockDb.getAllAsync.mockResolvedValue([makeJournalRow({ mood: 4 })]);

      const result = await journalRepository.getEntriesWithMood('2026-02-12', '2026-02-18');

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('AND mood IS NOT NULL'),
        '2026-02-12',
        '2026-02-18',
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('getAllTags', () => {
    it('returns deduplicated sorted tags from all entries', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        { tags: '["work","ideas"]' },
        { tags: '["ideas","personal"]' },
      ]);

      const result = await journalRepository.getAllTags();

      expect(result).toEqual(['ideas', 'personal', 'work']);
    });

    it('returns empty array when no tags', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      const result = await journalRepository.getAllTags();

      expect(result).toEqual([]);
    });
  });
});
