import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@/src/theme/ThemeContext';
import DashboardScreen from '@/app/(tabs)/index';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success', Error: 'error' },
}));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
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

const mockGetTrendData = jest.fn().mockResolvedValue(null);
const mockGetDailyStreak = jest.fn().mockResolvedValue(0);

jest.mock('@/src/services/insights', () => ({
  getTrendData: (...args: unknown[]) => mockGetTrendData(...args),
  getDailyStreak: (...args: unknown[]) => mockGetDailyStreak(...args),
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

async function renderDashboard() {
  const result = renderWithTheme(<DashboardScreen />);
  // Wait for all async effects (db init, data loading, trend data) to settle
  await waitFor(() => {
    expect(mockGetDailyStreak).toHaveBeenCalled();
  });
  return result;
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
    mockGetTrendData.mockResolvedValue(null);
    mockGetDailyStreak.mockResolvedValue(0);
  });

  it('renders all dashboard cards', async () => {
    const { findByText } = await renderDashboard();
    expect(await findByText('Habits')).toBeTruthy();
    expect(await findByText('Sleep')).toBeTruthy();
    expect(await findByText('Exercise')).toBeTruthy();
    expect(await findByText('Nutrition')).toBeTruthy();
    expect(await findByText('Journal')).toBeTruthy();
  });

  it('shows habit progress when habits exist', async () => {
    mockHabitStore.habits = [{ id: 'h1', name: 'Read', color: '#FF0000' }] as never[];
    mockHabitStore.todayCompletions = new Map([['h1', { completed: true }]]) as never;

    const { findByText } = await renderDashboard();
    expect(await findByText('1/1')).toBeTruthy();
  });

  it('shows dashes when no data exists', async () => {
    const { findAllByText } = await renderDashboard();
    const dashes = await findAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it('shows error banner when a store has an error', async () => {
    mockHabitStore.error = 'Failed to load habits';

    const { findByText } = await renderDashboard();
    expect(await findByText('Failed to load habits')).toBeTruthy();
  });

  it('shows demo section when no habits exist', async () => {
    const { findByText } = await renderDashboard();
    expect(await findByText('Welcome to Trackr')).toBeTruthy();
    expect(await findByText('Load Demo Data')).toBeTruthy();
  });

  it('hides demo section when habits exist', async () => {
    mockHabitStore.habits = [{ id: 'h1', name: 'Read', color: '#FF0000' }] as never[];

    const { queryByText } = await renderDashboard();
    expect(queryByText('Welcome to Trackr')).toBeNull();
  });

  it('shows no entries text for journal', async () => {
    const { findByText } = await renderDashboard();
    expect(await findByText('No entries yet')).toBeTruthy();
  });

  it('loads all data on mount', async () => {
    await renderDashboard();

    expect(mockLoadHabits).toHaveBeenCalled();
    expect(mockLoadTodayCompletions).toHaveBeenCalled();
    expect(mockLoadSleep).toHaveBeenCalled();
    expect(mockLoadExercise).toHaveBeenCalled();
    expect(mockLoadDailyTotals).toHaveBeenCalled();
    expect(mockLoadJournal).toHaveBeenCalled();
  });

  it('shows nutrition calories when available', async () => {
    mockNutritionStore.dailyTotals = { calories: 1850, protein: 80, carbs: 200, fat: 60 };

    const { findByText } = await renderDashboard();
    expect(await findByText('1850')).toBeTruthy();
    expect(await findByText('calories')).toBeTruthy();
  });

  it('shows exercise duration when sessions exist', async () => {
    mockExerciseStore.sessions = [
      {
        id: 'e1',
        date: new Date().toISOString().split('T')[0],
        durationMinutes: 45,
        type: 'running',
      },
    ] as never[];

    const { findByText } = await renderDashboard();
    expect(await findByText('1 workout')).toBeTruthy();
  });

  it('shows journal entry count when entries exist', async () => {
    const today = new Date().toISOString().split('T')[0];
    mockJournalStore.entries = [
      { id: 'j1', date: today, content: 'Test', title: 'Entry 1' },
      { id: 'j2', date: today, content: 'Test2', title: 'Entry 2' },
    ] as never[];

    const { findByText } = await renderDashboard();
    expect(await findByText('2 entries')).toBeTruthy();
  });

  it('loads demo data when button is pressed', async () => {
    const { populateDemoData } = jest.requireMock('@/src/utils/demoData');
    jest.spyOn(Alert, 'alert');

    const { findByText } = await renderDashboard();
    const button = await findByText('Load Demo Data');
    fireEvent.press(button);

    await waitFor(() => {
      expect(populateDemoData).toHaveBeenCalled();
    });
  });

  it('shows error from any store', async () => {
    mockNutritionStore.error = 'Network error loading meals';

    const { findByText } = await renderDashboard();
    expect(await findByText('Network error loading meals')).toBeTruthy();
  });

  it('shows streak badge when streak > 0', async () => {
    mockGetDailyStreak.mockResolvedValue(5);

    const { findByText } = await renderDashboard();
    expect(await findByText('5 days')).toBeTruthy();
  });

  it('navigates to habits screen when habits card is pressed', async () => {
    const { findByText } = await renderDashboard();
    const habitsCard = await findByText('Habits');
    fireEvent.press(habitsCard);
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/habits');
  });

  it('navigates to sleep screen when sleep card is pressed', async () => {
    const { findByText } = await renderDashboard();
    const sleepCard = await findByText('Sleep');
    fireEvent.press(sleepCard);
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/sleep');
  });

  it('navigates to journal screen when journal card is pressed', async () => {
    const { findByText } = await renderDashboard();
    const journalCard = await findByText('Journal');
    fireEvent.press(journalCard);
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/journal');
  });

  it('dismisses error banner and clears all errors', async () => {
    mockHabitStore.error = 'Habit error';
    mockSleepStore.error = 'Sleep error';

    const { findByText } = await renderDashboard();
    // Error banner shows first error — pressing the text dismisses it
    const errorText = await findByText('Habit error');
    fireEvent.press(errorText);

    expect(mockClearHabitError).toHaveBeenCalled();
    expect(mockClearSleepError).toHaveBeenCalled();
    expect(mockClearExerciseError).toHaveBeenCalled();
    expect(mockClearNutritionError).toHaveBeenCalled();
    expect(mockClearJournalError).toHaveBeenCalled();
  });

  it('shows error alert when demo data fails to load', async () => {
    const { populateDemoData } = jest.requireMock('@/src/utils/demoData');
    populateDemoData.mockRejectedValueOnce(new Error('DB full'));
    jest.spyOn(Alert, 'alert');

    const { findByText } = await renderDashboard();
    fireEvent.press(await findByText('Load Demo Data'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to load demo data');
    });
  });

  it('reloads data on pull-to-refresh', async () => {
    const { getByTestId, UNSAFE_getByType } = await renderDashboard();

    jest.clearAllMocks();
    mockGetTrendData.mockResolvedValue(null);
    mockGetDailyStreak.mockResolvedValue(0);

    // Find ScrollView and trigger its refreshControl onRefresh
    const scrollView = UNSAFE_getByType(require('react-native').ScrollView);
    const refreshControl = scrollView.props.refreshControl;
    await waitFor(async () => {
      await refreshControl.props.onRefresh();
    });

    expect(mockLoadHabits).toHaveBeenCalled();
    expect(mockLoadSleep).toHaveBeenCalled();
    expect(mockLoadExercise).toHaveBeenCalled();
  });
});
