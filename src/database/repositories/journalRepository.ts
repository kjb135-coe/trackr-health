import { getDatabase } from '../index';
import { JournalEntry } from '@/src/types';
import { generateId, safeJsonParse } from '@/src/utils/date';

// Database row types for type-safe SQL queries
interface JournalEntryRow {
  id: string;
  date: string;
  title: string | null;
  content: string;
  mood: number | null;
  tags: string | null;
  is_scanned: number;
  original_image_uri: string | null;
  ocr_confidence: number | null;
  created_at: string;
  updated_at: string;
}

export const journalRepository = {
  async getAll(): Promise<JournalEntry[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<JournalEntryRow>(
      'SELECT * FROM journal_entries ORDER BY date DESC, created_at DESC',
    );
    return rows.map(mapRowToEntry);
  },

  async getById(id: string): Promise<JournalEntry | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<JournalEntryRow>(
      'SELECT * FROM journal_entries WHERE id = ?',
      id,
    );
    return row ? mapRowToEntry(row) : null;
  },

  async getByDate(date: string): Promise<JournalEntry[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<JournalEntryRow>(
      'SELECT * FROM journal_entries WHERE date = ? ORDER BY created_at DESC',
      date,
    );
    return rows.map(mapRowToEntry);
  },

  async getByDateRange(startDate: string, endDate: string): Promise<JournalEntry[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<JournalEntryRow>(
      'SELECT * FROM journal_entries WHERE date >= ? AND date <= ? ORDER BY date DESC, created_at DESC',
      startDate,
      endDate,
    );
    return rows.map(mapRowToEntry);
  },

  async search(query: string): Promise<JournalEntry[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<JournalEntryRow>(
      `SELECT * FROM journal_entries
       WHERE content LIKE ? OR title LIKE ?
       ORDER BY date DESC, created_at DESC`,
      `%${query}%`,
      `%${query}%`,
    );
    return rows.map(mapRowToEntry);
  },

  async create(entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<JournalEntry> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const id = generateId();

    await db.runAsync(
      `INSERT INTO journal_entries (id, date, title, content, mood, tags, is_scanned, original_image_uri, ocr_confidence, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      entry.date,
      entry.title ?? null,
      entry.content,
      entry.mood ?? null,
      entry.tags ? JSON.stringify(entry.tags) : null,
      entry.isScanned ? 1 : 0,
      entry.originalImageUri ?? null,
      entry.ocrConfidence ?? null,
      now,
      now,
    );

    return { ...entry, id, createdAt: now, updatedAt: now };
  },

  async update(
    id: string,
    updates: Partial<Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.date !== undefined) {
      fields.push('date = ?');
      values.push(updates.date);
    }
    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.content !== undefined) {
      fields.push('content = ?');
      values.push(updates.content);
    }
    if (updates.mood !== undefined) {
      fields.push('mood = ?');
      values.push(updates.mood);
    }
    if (updates.tags !== undefined) {
      fields.push('tags = ?');
      values.push(JSON.stringify(updates.tags));
    }
    if (updates.isScanned !== undefined) {
      fields.push('is_scanned = ?');
      values.push(updates.isScanned ? 1 : 0);
    }
    if (updates.originalImageUri !== undefined) {
      fields.push('original_image_uri = ?');
      values.push(updates.originalImageUri);
    }
    if (updates.ocrConfidence !== undefined) {
      fields.push('ocr_confidence = ?');
      values.push(updates.ocrConfidence);
    }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    await db.runAsync(`UPDATE journal_entries SET ${fields.join(', ')} WHERE id = ?`, ...values);
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM journal_entries WHERE id = ?', id);
  },

  async getEntriesWithMood(startDate: string, endDate: string): Promise<JournalEntry[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<JournalEntryRow>(
      `SELECT * FROM journal_entries
       WHERE date >= ? AND date <= ? AND mood IS NOT NULL
       ORDER BY date`,
      startDate,
      endDate,
    );
    return rows.map(mapRowToEntry);
  },

  async getAllTags(): Promise<string[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ tags: string | null }>(
      'SELECT tags FROM journal_entries WHERE tags IS NOT NULL',
    );
    const tagSet = new Set<string>();
    for (const row of rows) {
      if (row.tags) {
        try {
          const tags = JSON.parse(row.tags) as string[];
          tags.forEach((tag) => tagSet.add(tag));
        } catch {
          // Skip rows with corrupted JSON
        }
      }
    }
    return Array.from(tagSet).sort();
  },
};

function mapRowToEntry(row: JournalEntryRow): JournalEntry {
  return {
    id: row.id,
    date: row.date,
    title: row.title ?? undefined,
    content: row.content,
    mood: (row.mood as JournalEntry['mood']) ?? undefined,
    tags: safeJsonParse<string[]>(row.tags),
    isScanned: Boolean(row.is_scanned),
    originalImageUri: row.original_image_uri ?? undefined,
    ocrConfidence: row.ocr_confidence ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
