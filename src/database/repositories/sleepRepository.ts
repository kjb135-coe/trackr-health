import { getDatabase } from '../index';
import { SleepEntry } from '@/src/types';
import { generateId } from '@/src/utils/date';

export const sleepRepository = {
  async getAll(): Promise<SleepEntry[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>('SELECT * FROM sleep_entries ORDER BY date DESC');
    return rows.map(mapRowToSleepEntry);
  },

  async getByDate(date: string): Promise<SleepEntry | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>('SELECT * FROM sleep_entries WHERE date = ?', date);
    return row ? mapRowToSleepEntry(row) : null;
  },

  async getByDateRange(startDate: string, endDate: string): Promise<SleepEntry[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM sleep_entries WHERE date >= ? AND date <= ? ORDER BY date',
      startDate,
      endDate
    );
    return rows.map(mapRowToSleepEntry);
  },

  async create(entry: Omit<SleepEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<SleepEntry> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const id = generateId();

    await db.runAsync(
      `INSERT INTO sleep_entries (id, date, bedtime, wake_time, duration_minutes, quality, notes, factors, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      entry.date,
      entry.bedtime,
      entry.wakeTime,
      entry.durationMinutes,
      entry.quality,
      entry.notes ?? null,
      entry.factors ? JSON.stringify(entry.factors) : null,
      now,
      now
    );

    return { ...entry, id, createdAt: now, updatedAt: now };
  },

  async update(id: string, updates: Partial<Omit<SleepEntry, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.date !== undefined) {
      fields.push('date = ?');
      values.push(updates.date);
    }
    if (updates.bedtime !== undefined) {
      fields.push('bedtime = ?');
      values.push(updates.bedtime);
    }
    if (updates.wakeTime !== undefined) {
      fields.push('wake_time = ?');
      values.push(updates.wakeTime);
    }
    if (updates.durationMinutes !== undefined) {
      fields.push('duration_minutes = ?');
      values.push(updates.durationMinutes);
    }
    if (updates.quality !== undefined) {
      fields.push('quality = ?');
      values.push(updates.quality);
    }
    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      values.push(updates.notes);
    }
    if (updates.factors !== undefined) {
      fields.push('factors = ?');
      values.push(JSON.stringify(updates.factors));
    }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    await db.runAsync(
      `UPDATE sleep_entries SET ${fields.join(', ')} WHERE id = ?`,
      ...values
    );
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM sleep_entries WHERE id = ?', id);
  },

  async getAverageQuality(startDate: string, endDate: string): Promise<number | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ avg: number | null }>(
      'SELECT AVG(quality) as avg FROM sleep_entries WHERE date >= ? AND date <= ?',
      startDate,
      endDate
    );
    return result?.avg ?? null;
  },

  async getAverageDuration(startDate: string, endDate: string): Promise<number | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ avg: number | null }>(
      'SELECT AVG(duration_minutes) as avg FROM sleep_entries WHERE date >= ? AND date <= ?',
      startDate,
      endDate
    );
    return result?.avg ?? null;
  },
};

function mapRowToSleepEntry(row: any): SleepEntry {
  return {
    id: row.id,
    date: row.date,
    bedtime: row.bedtime,
    wakeTime: row.wake_time,
    durationMinutes: row.duration_minutes,
    quality: row.quality,
    notes: row.notes,
    factors: row.factors ? JSON.parse(row.factors) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
