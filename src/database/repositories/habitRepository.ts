import { getDatabase } from '../index';
import { Habit, HabitCompletion } from '@/src/types';
import { generateId, getDateString } from '@/src/utils/date';

// Database row types for type-safe SQL queries
interface HabitRow {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string;
  frequency: 'daily' | 'weekly' | 'custom';
  target_days_per_week: number | null;
  reminder_time: string | null;
  created_at: string;
  updated_at: string;
}

interface HabitCompletionRow {
  id: string;
  habit_id: string;
  date: string;
  completed: number;
  completed_at: string | null;
  notes: string | null;
}

export const habitRepository = {
  async getAll(): Promise<Habit[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<HabitRow>('SELECT * FROM habits ORDER BY created_at DESC');
    return rows.map(mapRowToHabit);
  },

  async getById(id: string): Promise<Habit | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<HabitRow>('SELECT * FROM habits WHERE id = ?', id);
    return row ? mapRowToHabit(row) : null;
  },

  async create(habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>): Promise<Habit> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const id = generateId();

    await db.runAsync(
      `INSERT INTO habits (id, name, description, icon, color, frequency, target_days_per_week, reminder_time, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      habit.name,
      habit.description ?? null,
      habit.icon ?? null,
      habit.color,
      habit.frequency,
      habit.targetDaysPerWeek ?? null,
      habit.reminderTime ?? null,
      now,
      now,
    );

    return { ...habit, id, createdAt: now, updatedAt: now };
  },

  async update(
    id: string,
    updates: Partial<Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.icon !== undefined) {
      fields.push('icon = ?');
      values.push(updates.icon);
    }
    if (updates.color !== undefined) {
      fields.push('color = ?');
      values.push(updates.color);
    }
    if (updates.frequency !== undefined) {
      fields.push('frequency = ?');
      values.push(updates.frequency);
    }
    if (updates.targetDaysPerWeek !== undefined) {
      fields.push('target_days_per_week = ?');
      values.push(updates.targetDaysPerWeek);
    }
    if (updates.reminderTime !== undefined) {
      fields.push('reminder_time = ?');
      values.push(updates.reminderTime);
    }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    await db.runAsync(`UPDATE habits SET ${fields.join(', ')} WHERE id = ?`, ...values);
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM habits WHERE id = ?', id);
  },

  async getAllCompletions(): Promise<HabitCompletion[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<HabitCompletionRow>(
      'SELECT * FROM habit_completions ORDER BY date DESC',
    );
    return rows.map(mapRowToCompletion);
  },

  async getCompletionsForDate(date: string): Promise<HabitCompletion[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<HabitCompletionRow>(
      'SELECT * FROM habit_completions WHERE date = ?',
      date,
    );
    return rows.map(mapRowToCompletion);
  },

  async getCompletionsForHabit(
    habitId: string,
    startDate: string,
    endDate: string,
  ): Promise<HabitCompletion[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<HabitCompletionRow>(
      'SELECT * FROM habit_completions WHERE habit_id = ? AND date >= ? AND date <= ? ORDER BY date',
      habitId,
      startDate,
      endDate,
    );
    return rows.map(mapRowToCompletion);
  },

  async getCompletionsForDateRange(startDate: string, endDate: string): Promise<HabitCompletion[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<HabitCompletionRow>(
      'SELECT * FROM habit_completions WHERE date >= ? AND date <= ? ORDER BY date',
      startDate,
      endDate,
    );
    return rows.map(mapRowToCompletion);
  },

  async setCompletion(
    habitId: string,
    date: string,
    completed: boolean,
    notes?: string,
  ): Promise<HabitCompletion> {
    const db = await getDatabase();
    const id = generateId();
    const now = completed ? new Date().toISOString() : null;

    await db.runAsync(
      `INSERT INTO habit_completions (id, habit_id, date, completed, completed_at, notes)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(habit_id, date) DO UPDATE SET
         completed = excluded.completed,
         completed_at = excluded.completed_at,
         notes = excluded.notes`,
      id,
      habitId,
      date,
      completed ? 1 : 0,
      now,
      notes ?? null,
    );

    return {
      id,
      habitId,
      date,
      completed,
      completedAt: now ?? undefined,
      notes,
    };
  },

  async getStreak(habitId: string): Promise<number> {
    const db = await getDatabase();
    const today = getDateString();

    // Fetch recent completed dates in descending order (single query)
    const rows = await db.getAllAsync<{ date: string }>(
      `SELECT date FROM habit_completions
       WHERE habit_id = ? AND completed = 1 AND date <= ?
       ORDER BY date DESC`,
      habitId,
      today,
    );

    // Count consecutive days starting from today
    let streak = 0;
    const expectedDate = new Date();
    for (const row of rows) {
      const expected = getDateString(expectedDate);
      if (row.date === expected) {
        streak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  },
};

function mapRowToHabit(row: HabitRow): Habit {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    icon: row.icon ?? undefined,
    color: row.color,
    frequency: row.frequency,
    targetDaysPerWeek: row.target_days_per_week ?? undefined,
    reminderTime: row.reminder_time ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRowToCompletion(row: HabitCompletionRow): HabitCompletion {
  return {
    id: row.id,
    habitId: row.habit_id,
    date: row.date,
    completed: Boolean(row.completed),
    completedAt: row.completed_at ?? undefined,
    notes: row.notes ?? undefined,
  };
}
