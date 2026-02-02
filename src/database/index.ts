import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync('trackr.db');
  await runMigrations(db);
  return db;
}

async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  // Create migrations table if not exists
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Check which migrations have been applied
  const appliedMigrations = await database.getAllAsync<{ name: string }>(
    'SELECT name FROM migrations'
  );
  const appliedSet = new Set(appliedMigrations.map((m) => m.name));

  // Run pending migrations
  for (const migration of migrations) {
    if (!appliedSet.has(migration.name)) {
      await database.execAsync(migration.sql);
      await database.runAsync(
        'INSERT INTO migrations (name) VALUES (?)',
        migration.name
      );
    }
  }
}

interface Migration {
  name: string;
  sql: string;
}

const migrations: Migration[] = [
  {
    name: '001_initial_schema',
    sql: `
      -- Habits
      CREATE TABLE IF NOT EXISTS habits (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        color TEXT NOT NULL,
        frequency TEXT NOT NULL CHECK(frequency IN ('daily', 'weekly', 'custom')),
        target_days_per_week INTEGER,
        reminder_time TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS habit_completions (
        id TEXT PRIMARY KEY,
        habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        completed_at TEXT,
        notes TEXT,
        UNIQUE(habit_id, date)
      );

      CREATE INDEX IF NOT EXISTS idx_habit_completions_date ON habit_completions(date);
      CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_date ON habit_completions(habit_id, date);

      -- Sleep
      CREATE TABLE IF NOT EXISTS sleep_entries (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL UNIQUE,
        bedtime TEXT NOT NULL,
        wake_time TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL,
        quality INTEGER NOT NULL CHECK(quality BETWEEN 1 AND 5),
        notes TEXT,
        factors TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_sleep_entries_date ON sleep_entries(date);

      -- Exercise
      CREATE TABLE IF NOT EXISTS exercise_sessions (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        type TEXT NOT NULL,
        custom_type TEXT,
        duration_minutes INTEGER NOT NULL,
        intensity TEXT NOT NULL CHECK(intensity IN ('low', 'moderate', 'high', 'very_high')),
        calories_burned INTEGER,
        notes TEXT,
        heart_rate_avg INTEGER,
        heart_rate_max INTEGER,
        distance REAL,
        distance_unit TEXT CHECK(distance_unit IN ('km', 'miles')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_exercise_sessions_date ON exercise_sessions(date);

      -- Nutrition
      CREATE TABLE IF NOT EXISTS meals (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        meal_type TEXT NOT NULL CHECK(meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
        name TEXT,
        total_calories INTEGER NOT NULL DEFAULT 0,
        total_protein REAL,
        total_carbs REAL,
        total_fat REAL,
        total_fiber REAL,
        photo_uri TEXT,
        ai_analysis TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS food_items (
        id TEXT PRIMARY KEY,
        meal_id TEXT NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        calories INTEGER NOT NULL,
        protein REAL,
        carbs REAL,
        fat REAL,
        is_ai_generated INTEGER NOT NULL DEFAULT 0,
        confidence REAL
      );

      CREATE INDEX IF NOT EXISTS idx_meals_date ON meals(date);
      CREATE INDEX IF NOT EXISTS idx_food_items_meal ON food_items(meal_id);

      -- Journal
      CREATE TABLE IF NOT EXISTS journal_entries (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        title TEXT,
        content TEXT NOT NULL,
        mood INTEGER CHECK(mood BETWEEN 1 AND 5),
        tags TEXT,
        is_scanned INTEGER NOT NULL DEFAULT 0,
        original_image_uri TEXT,
        ocr_confidence REAL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(date);
    `,
  },
];

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
