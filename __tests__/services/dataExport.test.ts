import {
  exportAllData,
  generateCSVExport,
  shareExportedData,
  shareCSVExport,
} from '@/src/services/export/dataExport';

const mockWriteAsStringAsync = jest.fn();
const mockShareAsync = jest.fn();
const mockIsAvailableAsync = jest.fn();

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///docs/',
  writeAsStringAsync: (...args: unknown[]) => mockWriteAsStringAsync(...args),
}));

jest.mock('expo-sharing', () => ({
  shareAsync: (...args: unknown[]) => mockShareAsync(...args),
  isAvailableAsync: () => mockIsAvailableAsync(),
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { version: '1.0.0' } },
}));

const mockHabits = [
  {
    id: 'h1',
    name: 'Read',
    description: '',
    frequency: 'daily',
    color: '#FF0000',
    icon: '',
    reminderTime: '',
    createdAt: '2026-02-18T00:00:00Z',
  },
];
const mockCompletions = [{ id: 'c1', habitId: 'h1', date: '2026-02-18', completed: true }];
const mockSleep = [
  {
    id: 's1',
    date: '2026-02-18',
    bedtime: '22:00',
    wakeTime: '06:00',
    durationMinutes: 480,
    quality: 4,
    createdAt: '2026-02-18T00:00:00Z',
  },
];
const mockExercise = [
  {
    id: 'e1',
    date: '2026-02-18',
    type: 'running',
    durationMinutes: 30,
    intensity: 'moderate',
    caloriesBurned: 300,
    createdAt: '2026-02-18T00:00:00Z',
  },
];
const mockMeals = [
  {
    id: 'm1',
    date: '2026-02-18',
    mealType: 'lunch',
    name: 'Salad',
    totalCalories: 400,
    totalProtein: 20,
    totalCarbs: 30,
    totalFat: 15,
    createdAt: '2026-02-18T00:00:00Z',
  },
];
const mockJournal = [
  {
    id: 'j1',
    date: '2026-02-18',
    title: 'Day',
    mood: 4,
    tags: ['work'],
    isScanned: false,
    createdAt: '2026-02-18T00:00:00Z',
  },
];

jest.mock('@/src/database/repositories', () => ({
  habitRepository: {
    getAll: jest.fn(() => Promise.resolve(mockHabits)),
    getAllCompletions: jest.fn(() => Promise.resolve(mockCompletions)),
  },
  sleepRepository: {
    getAll: jest.fn(() => Promise.resolve(mockSleep)),
  },
  exerciseRepository: {
    getAll: jest.fn(() => Promise.resolve(mockExercise)),
  },
  nutritionRepository: {
    getAllMeals: jest.fn(() => Promise.resolve(mockMeals)),
  },
  journalRepository: {
    getAll: jest.fn(() => Promise.resolve(mockJournal)),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockWriteAsStringAsync.mockResolvedValue(undefined);
});

describe('dataExport', () => {
  describe('exportAllData', () => {
    it('exports all data as JSON file and returns path', async () => {
      const filePath = await exportAllData();

      expect(filePath).toMatch(/^file:\/\/\/docs\/trackr-export-\d{4}-\d{2}-\d{2}\.json$/);
      expect(mockWriteAsStringAsync).toHaveBeenCalledTimes(1);

      const [, content] = mockWriteAsStringAsync.mock.calls[0];
      const parsed = JSON.parse(content);
      expect(parsed.version).toBe('1.0.0');
      expect(parsed.habits).toEqual(mockHabits);
      expect(parsed.habitCompletions).toEqual(mockCompletions);
      expect(parsed.sleep).toEqual(mockSleep);
      expect(parsed.exercise).toEqual(mockExercise);
      expect(parsed.meals).toEqual(mockMeals);
      expect(parsed.journal).toEqual(mockJournal);
    });
  });

  describe('shareExportedData', () => {
    it('shares exported JSON when sharing is available', async () => {
      mockIsAvailableAsync.mockResolvedValue(true);

      await shareExportedData();

      expect(mockShareAsync).toHaveBeenCalledWith(expect.stringContaining('trackr-export-'), {
        mimeType: 'application/json',
        dialogTitle: 'Export Trackr Data',
      });
    });

    it('throws when sharing is not available', async () => {
      mockIsAvailableAsync.mockResolvedValue(false);

      await expect(shareExportedData()).rejects.toThrow('Sharing is not available');
    });
  });

  describe('generateCSVExport', () => {
    it('generates habits CSV with correct headers', async () => {
      const filePath = await generateCSVExport('habits');

      expect(filePath).toBe('file:///docs/trackr-habits.csv');
      const [, content] = mockWriteAsStringAsync.mock.calls[0];
      expect(content).toContain('id,name,description,frequency');
      expect(content).toContain('"h1"');
      expect(content).toContain('"Read"');
    });

    it('generates sleep CSV with correct headers', async () => {
      const filePath = await generateCSVExport('sleep');

      expect(filePath).toBe('file:///docs/trackr-sleep.csv');
      const [, content] = mockWriteAsStringAsync.mock.calls[0];
      expect(content).toContain('id,date,bedtime,wakeTime,durationMinutes,quality');
      expect(content).toContain('"s1"');
    });

    it('generates exercise CSV with correct headers', async () => {
      const filePath = await generateCSVExport('exercise');

      expect(filePath).toBe('file:///docs/trackr-exercise.csv');
      const [, content] = mockWriteAsStringAsync.mock.calls[0];
      expect(content).toContain('id,date,type,durationMinutes,intensity');
    });

    it('generates nutrition CSV with correct headers', async () => {
      const filePath = await generateCSVExport('nutrition');

      expect(filePath).toBe('file:///docs/trackr-nutrition.csv');
      const [, content] = mockWriteAsStringAsync.mock.calls[0];
      expect(content).toContain('id,date,mealType,name,totalCalories');
    });

    it('generates journal CSV with correct headers', async () => {
      const filePath = await generateCSVExport('journal');

      expect(filePath).toBe('file:///docs/trackr-journal.csv');
      const [, content] = mockWriteAsStringAsync.mock.calls[0];
      expect(content).toContain('id,date,title,mood,tags');
    });
  });

  describe('shareCSVExport', () => {
    it('shares CSV when sharing is available', async () => {
      mockIsAvailableAsync.mockResolvedValue(true);

      await shareCSVExport('habits');

      expect(mockShareAsync).toHaveBeenCalledWith('file:///docs/trackr-habits.csv', {
        mimeType: 'text/csv',
        dialogTitle: 'Export habits data',
      });
    });

    it('throws when sharing is not available', async () => {
      mockIsAvailableAsync.mockResolvedValue(false);

      await expect(shareCSVExport('sleep')).rejects.toThrow('Sharing is not available');
    });
  });
});
