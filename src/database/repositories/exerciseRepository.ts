import { getDatabase } from '../index';
import { ExerciseSession } from '@/src/types';
import { generateId } from '@/src/utils/date';

// Database row types for type-safe SQL queries
interface ExerciseSessionRow {
  id: string;
  date: string;
  type: string;
  custom_type: string | null;
  duration_minutes: number;
  intensity: string;
  calories_burned: number | null;
  notes: string | null;
  heart_rate_avg: number | null;
  heart_rate_max: number | null;
  distance: number | null;
  distance_unit: string | null;
  created_at: string;
  updated_at: string;
}

export const exerciseRepository = {
  async getAll(): Promise<ExerciseSession[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<ExerciseSessionRow>(
      'SELECT * FROM exercise_sessions ORDER BY date DESC, created_at DESC',
    );
    return rows.map(mapRowToSession);
  },

  async getById(id: string): Promise<ExerciseSession | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<ExerciseSessionRow>(
      'SELECT * FROM exercise_sessions WHERE id = ?',
      id,
    );
    return row ? mapRowToSession(row) : null;
  },

  async getByDate(date: string): Promise<ExerciseSession[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<ExerciseSessionRow>(
      'SELECT * FROM exercise_sessions WHERE date = ? ORDER BY created_at',
      date,
    );
    return rows.map(mapRowToSession);
  },

  async getByDateRange(startDate: string, endDate: string): Promise<ExerciseSession[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<ExerciseSessionRow>(
      'SELECT * FROM exercise_sessions WHERE date >= ? AND date <= ? ORDER BY date, created_at',
      startDate,
      endDate,
    );
    return rows.map(mapRowToSession);
  },

  async create(
    session: Omit<ExerciseSession, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ExerciseSession> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const id = generateId();

    await db.runAsync(
      `INSERT INTO exercise_sessions (id, date, type, custom_type, duration_minutes, intensity, calories_burned, notes, heart_rate_avg, heart_rate_max, distance, distance_unit, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      session.date,
      session.type,
      session.customType ?? null,
      session.durationMinutes,
      session.intensity,
      session.caloriesBurned ?? null,
      session.notes ?? null,
      session.heartRateAvg ?? null,
      session.heartRateMax ?? null,
      session.distance ?? null,
      session.distanceUnit ?? null,
      now,
      now,
    );

    return { ...session, id, createdAt: now, updatedAt: now };
  },

  async update(
    id: string,
    updates: Partial<Omit<ExerciseSession, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.date !== undefined) {
      fields.push('date = ?');
      values.push(updates.date);
    }
    if (updates.type !== undefined) {
      fields.push('type = ?');
      values.push(updates.type);
    }
    if (updates.customType !== undefined) {
      fields.push('custom_type = ?');
      values.push(updates.customType);
    }
    if (updates.durationMinutes !== undefined) {
      fields.push('duration_minutes = ?');
      values.push(updates.durationMinutes);
    }
    if (updates.intensity !== undefined) {
      fields.push('intensity = ?');
      values.push(updates.intensity);
    }
    if (updates.caloriesBurned !== undefined) {
      fields.push('calories_burned = ?');
      values.push(updates.caloriesBurned);
    }
    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      values.push(updates.notes);
    }
    if (updates.heartRateAvg !== undefined) {
      fields.push('heart_rate_avg = ?');
      values.push(updates.heartRateAvg);
    }
    if (updates.heartRateMax !== undefined) {
      fields.push('heart_rate_max = ?');
      values.push(updates.heartRateMax);
    }
    if (updates.distance !== undefined) {
      fields.push('distance = ?');
      values.push(updates.distance);
    }
    if (updates.distanceUnit !== undefined) {
      fields.push('distance_unit = ?');
      values.push(updates.distanceUnit);
    }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    await db.runAsync(`UPDATE exercise_sessions SET ${fields.join(', ')} WHERE id = ?`, ...values);
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM exercise_sessions WHERE id = ?', id);
  },

  async getTotalDuration(startDate: string, endDate: string): Promise<number> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ total: number | null }>(
      'SELECT SUM(duration_minutes) as total FROM exercise_sessions WHERE date >= ? AND date <= ?',
      startDate,
      endDate,
    );
    return result?.total ?? 0;
  },

  async getTotalCalories(startDate: string, endDate: string): Promise<number> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ total: number | null }>(
      'SELECT SUM(calories_burned) as total FROM exercise_sessions WHERE date >= ? AND date <= ?',
      startDate,
      endDate,
    );
    return result?.total ?? 0;
  },
};

function mapRowToSession(row: ExerciseSessionRow): ExerciseSession {
  return {
    id: row.id,
    date: row.date,
    type: row.type as ExerciseSession['type'],
    customType: row.custom_type ?? undefined,
    durationMinutes: row.duration_minutes,
    intensity: row.intensity as ExerciseSession['intensity'],
    caloriesBurned: row.calories_burned ?? undefined,
    notes: row.notes ?? undefined,
    heartRateAvg: row.heart_rate_avg ?? undefined,
    heartRateMax: row.heart_rate_max ?? undefined,
    distance: row.distance ?? undefined,
    distanceUnit: (row.distance_unit as ExerciseSession['distanceUnit']) ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
