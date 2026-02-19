import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@/src/theme/ThemeContext';
import DashboardScreen from '@/app/(tabs)/index';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success', Error: 'error' },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const mockLoadHabits = jest.fn().mockResolvedValue(undefined);
const mockLoadTodayCompletions = jest.fn().mockResolvedValue(undefined);
const mockClearHabitError = jest.fn();
const mockLoadSleep = jest.fn().mockResolvedValue(undefined);
const mockClearSleepError = jest.fn();
const mockLoadExercise = jest.fn().mockResolvedValue(undefined);
const mockClearExerciseError = jest.fn();
const mockLoadDailyTotals = jest.fn().mockResolvedValue(undefined);
const mockClearNutritionError = jest.fn();
const mockLoadJournal = jest.fn().mockResolvedValue(undefined);
const mockClearJournalError = jest.fn();

const mockHabitStore = {
  habits: [] as never[],
  todayCompletions: new Map(),
  loadHabits: mockLoadHabits,
  loadTodayCompletions: mockLoadTodayCompletions,
  error: null as string | null,
  clearError: mockClearHabitError,
};

const mockSleepStore = {
  entries: [] as never[],
  loadEntries: mockLoadSleep,
  error: null as string | null,
  clearError: mockClearSleepError,
};

const mockExerciseStore = {
  sessions: [] as never[],
  loadSessions: mockLoadExercise,
  error: null as string | null,
  clearError: mockClearExerciseError,
};

const mockNutritionStore = {
  dailyTotals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
  loadDailyTotals: mockLoadDailyTotals,
  error: null as string | null,
  clearError: mockClearNutritionError,
};

const mockJournalStore = {
  entries: [] as never[],
  loadEntries: mockLoadJournal,
  error: null as string | null,
  clearError: mockClearJournalError,
};

jest.mock('@/src/store', () => ({
  useHabitStore: () => mockHabitStore,
  useSleepStore: () => mockSleepStore,
  useExerciseStore: () => mockExerciseStore,
  useNutritionStore: () => mockNutritionStore,
  useJournalStore: () => mockJournalStore,
}));

jest.mock('@/src/database', () => ({
  getDatabase: jest.fn().mockResolvedValue({}),
}));

jest.mock('@/src/services/insights', () => ({
  getTrendData: jest.fn().mockResolvedValue(null),
  getDailyStreak: jest.fn().mockResolvedValue(0),
}));

jest.mock('@/src/utils/demoData', () => ({
  populateDemoData: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/src/components/dashboard', () => ({
  QuickActions: () => null,
  WeeklyInsights: () => null,
  AICoaching: () => null,
}));

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

function resetStores() {
  mockHabitStore.habits = [];
  mockHabitStore.todayCompletions = new Map();
  mockHabitStore.error = null;

  mockSleepStore.entries = [];
  mockSleepStore.error = null;

  mockExerciseStore.sessions = [];
  mockExerciseStore.error = null;

  mockNutritionStore.dailyTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  mockNutritionStore.error = null;

  mockJournalStore.entries = [];
  mockJournalStore.error = null;
}

describe('DashboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStores();
  });

  it('renders all dashboard cards', async () => {
    const { findByText } = renderWithTheme(<DashboardScreen />);
    expect(await findByText('Habits')).toBeTruthy();
    expect(await findByText('Sleep')).toBeTruthy();
    expect(await findByText('Exercise')).toBeTruthy();
    expect(await findByText('Nutrition')).toBeTruthy();
    expect(await findByText('Journal')).toBeTruthy();
  });

  it('shows habit progress when habits exist', async () => {
    mockHabitStore.habits = [{ id: 'h1', name: 'Read', color: '#FF0000' }] as never[];
    mockHabitStore.todayCompletions = new Map([['h1', { completed: true }]]) as never;

    const { findByText } = renderWithTheme(<DashboardScreen />);
    expect(await findByText('1/1')).toBeTruthy();
  });

  it('shows dashes when no data exists', async () => {
    const { findAllByText } = renderWithTheme(<DashboardScreen />);
    const dashes = await findAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it('shows error banner when a store has an error', async () => {
    mockHabitStore.error = 'Failed to load habits';

    const { findByText } = renderWithTheme(<DashboardScreen />);
    expect(await findByText('Failed to load habits')).toBeTruthy();
  });

  it('shows demo section when no habits exist', async () => {
    const { findByText } = renderWithTheme(<DashboardScreen />);
    expect(await findByText('Welcome to Trackr')).toBeTruthy();
    expect(await findByText('Load Demo Data')).toBeTruthy();
  });

  it('hides demo section when habits exist', async () => {
    mockHabitStore.habits = [{ id: 'h1', name: 'Read', color: '#FF0000' }] as never[];

    const { queryByText } = renderWithTheme(<DashboardScreen />);
    await waitFor(() => {
      expect(queryByText('Welcome to Trackr')).toBeNull();
    });
  });

  it('shows no entries text for journal', async () => {
    const { findByText } = renderWithTheme(<DashboardScreen />);
    expect(await findByText('No entries yet')).toBeTruthy();
  });

  it('loads all data on mount', async () => {
    renderWithTheme(<DashboardScreen />);

    await waitFor(() => {
      expect(mockLoadHabits).toHaveBeenCalled();
      expect(mockLoadTodayCompletions).toHaveBeenCalled();
      expect(mockLoadSleep).toHaveBeenCalled();
      expect(mockLoadExercise).toHaveBeenCalled();
      expect(mockLoadDailyTotals).toHaveBeenCalled();
      expect(mockLoadJournal).toHaveBeenCalled();
    });
  });
});
