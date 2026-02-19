const mockExecAsync = jest.fn();
const mockRunAsync = jest.fn();
const mockGetAllAsync = jest.fn();
const mockCloseAsync = jest.fn();

const mockDatabase = {
  execAsync: mockExecAsync,
  runAsync: mockRunAsync,
  getAllAsync: mockGetAllAsync,
  closeAsync: mockCloseAsync,
};

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() => Promise.resolve(mockDatabase)),
}));

let getDatabase: typeof import('@/src/database/index').getDatabase;
let closeDatabase: typeof import('@/src/database/index').closeDatabase;

beforeEach(() => {
  jest.clearAllMocks();
  // Re-import to reset the module-level `db` variable
  jest.resetModules();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('@/src/database/index');
  getDatabase = mod.getDatabase;
  closeDatabase = mod.closeDatabase;
  mockGetAllAsync.mockResolvedValue([]);
});

describe('database init', () => {
  it('opens database and runs migrations on first call', async () => {
    const db = await getDatabase();

    expect(db).toBe(mockDatabase);
    expect(mockExecAsync).toHaveBeenCalledTimes(2); // migrations table + schema
    expect(mockRunAsync).toHaveBeenCalledWith(
      'INSERT INTO migrations (name) VALUES (?)',
      '001_initial_schema',
    );
  });

  it('returns cached database on subsequent calls', async () => {
    const db1 = await getDatabase();
    const db2 = await getDatabase();

    expect(db1).toBe(db2);
    // Should only open once
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SQLite = require('expo-sqlite');
    expect(SQLite.openDatabaseAsync).toHaveBeenCalledTimes(1);
  });

  it('skips already-applied migrations', async () => {
    mockGetAllAsync.mockResolvedValue([{ name: '001_initial_schema' }]);

    await getDatabase();

    // Should create migrations table but NOT run schema migration
    expect(mockExecAsync).toHaveBeenCalledTimes(1); // Only migrations table
    expect(mockRunAsync).not.toHaveBeenCalled();
  });

  it('does not cache database if migrations fail', async () => {
    mockExecAsync.mockRejectedValueOnce(new Error('migration failed'));

    await expect(getDatabase()).rejects.toThrow('migration failed');

    // Reset mock for second call
    mockExecAsync.mockResolvedValue(undefined);
    mockGetAllAsync.mockResolvedValue([]);

    // Should retry opening since db was not cached
    const db = await getDatabase();
    expect(db).toBe(mockDatabase);
  });

  describe('closeDatabase', () => {
    it('closes and clears cached database', async () => {
      await getDatabase();
      await closeDatabase();

      expect(mockCloseAsync).toHaveBeenCalledTimes(1);

      // Next call should re-open
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const SQLite = require('expo-sqlite');
      SQLite.openDatabaseAsync.mockClear();
      mockExecAsync.mockResolvedValue(undefined);

      await getDatabase();
      expect(SQLite.openDatabaseAsync).toHaveBeenCalledTimes(1);
    });

    it('does nothing if no database is open', async () => {
      await closeDatabase();
      expect(mockCloseAsync).not.toHaveBeenCalled();
    });
  });
});
