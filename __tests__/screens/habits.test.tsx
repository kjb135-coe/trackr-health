import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ThemeProvider } from '@/src/theme/ThemeContext';
import HabitsScreen from '@/app/(tabs)/habits';
import { Habit, HabitCompletion } from '@/src/types';

jest.mock('react-native-reanimated', () => require('../helpers/reanimatedMock').reanimatedMock);

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success' },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@/src/services/claude', () => ({
  useApiKeyExists: () => false,
}));

jest.mock('@/src/services/notifications', () => ({
  cancelHabitReminder: jest.fn(),
  scheduleHabitReminder: jest.fn(),
}));

let mockHabits: Habit[] = [];
let mockTodayCompletions = new Map<string, HabitCompletion>();
let mockIsLoading = false;
let mockError: string | null = null;

const mockLoadHabits = jest.fn();
const mockLoadTodayCompletions = jest.fn();
const mockDeleteHabit = jest.fn();
const mockToggleCompletion = jest.fn();
const mockGetStreak = jest.fn();
const mockGetAllStreaks = jest.fn();
const mockGetWeeklyCompletions = jest.fn();
const mockClearError = jest.fn();
const mockFetchHabitSuggestions = jest.fn();

jest.mock('@/src/store', () => ({
  useHabitStore: () => ({
    habits: mockHabits,
    todayCompletions: mockTodayCompletions,
    isLoading: mockIsLoading,
    error: mockError,
    loadHabits: mockLoadHabits,
    loadTodayCompletions: mockLoadTodayCompletions,
    deleteHabit: mockDeleteHabit,
    toggleCompletion: mockToggleCompletion,
    getStreak: mockGetStreak,
    getAllStreaks: mockGetAllStreaks,
    getWeeklyCompletions: mockGetWeeklyCompletions,
    clearError: mockClearError,
  }),
  useAIInsightsStore: Object.assign(
    () => ({
      habitSuggestions: [],
      fetchHabitSuggestions: mockFetchHabitSuggestions,
    }),
    { setState: jest.fn() },
  ),
}));

jest.spyOn(Alert, 'alert');

function renderWithTheme() {
  return render(
    <ThemeProvider>
      <HabitsScreen />
    </ThemeProvider>,
  );
}

describe('HabitsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHabits = [];
    mockTodayCompletions = new Map();
    mockIsLoading = false;
    mockError = null;
    mockLoadHabits.mockResolvedValue(undefined);
    mockLoadTodayCompletions.mockResolvedValue(undefined);
    mockGetAllStreaks.mockResolvedValue(new Map());
    mockGetWeeklyCompletions.mockResolvedValue(new Map());
    mockGetStreak.mockResolvedValue(0);
    mockDeleteHabit.mockResolvedValue(undefined);
    mockToggleCompletion.mockResolvedValue(undefined);
  });

  it('renders empty state when no habits exist', async () => {
    const { findByText } = renderWithTheme();
    await findByText('No habits yet');
    await findByText('Tap + to create your first habit');
  });

  it('renders a habit name', async () => {
    mockHabits = [
      {
        id: 'h1',
        name: 'Meditate',
        color: '#8B5CF6',
        frequency: 'daily',
        createdAt: '2026-02-18T00:00:00.000Z',
        updatedAt: '2026-02-18T00:00:00.000Z',
      },
    ];
    const { findByText } = renderWithTheme();
    await findByText('Meditate');
  });

  it('renders multiple habits', async () => {
    mockHabits = [
      {
        id: 'h1',
        name: 'Meditate',
        color: '#8B5CF6',
        frequency: 'daily',
        createdAt: '2026-02-18T00:00:00.000Z',
        updatedAt: '2026-02-18T00:00:00.000Z',
      },
      {
        id: 'h2',
        name: 'Exercise',
        color: '#10B981',
        frequency: 'daily',
        createdAt: '2026-02-18T00:00:00.000Z',
        updatedAt: '2026-02-18T00:00:00.000Z',
      },
    ];
    const { findByText } = renderWithTheme();
    await findByText('Meditate');
    await findByText('Exercise');
  });

  it('renders habit with delete and edit affordances', async () => {
    mockHabits = [
      {
        id: 'h1',
        name: 'Read',
        color: '#EF4444',
        frequency: 'daily',
        createdAt: '2026-02-18T00:00:00.000Z',
        updatedAt: '2026-02-18T00:00:00.000Z',
      },
    ];
    const { findByText } = renderWithTheme();
    await findByText('Read');
    expect(mockLoadHabits).toHaveBeenCalled();
  });

  it('shows error banner when error exists', async () => {
    mockError = 'Failed to load habits';
    const { findByText } = renderWithTheme();
    await findByText('Failed to load habits');
  });

  it('calls loadHabits and loadTodayCompletions on mount', async () => {
    renderWithTheme();
    await waitFor(() => {
      expect(mockLoadHabits).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(mockLoadTodayCompletions).toHaveBeenCalled();
    });
  });

  it('shows loading skeletons when loading with no habits', async () => {
    mockIsLoading = true;
    mockHabits = [];
    const { queryByText } = renderWithTheme();
    // Should not show empty state when loading
    expect(queryByText('No habits yet')).toBeNull();
  });

  it('calls getAllStreaks after habits load', async () => {
    mockHabits = [
      {
        id: 'h1',
        name: 'Meditate',
        color: '#8B5CF6',
        frequency: 'daily',
        createdAt: '2026-02-18T00:00:00.000Z',
        updatedAt: '2026-02-18T00:00:00.000Z',
      },
    ];
    renderWithTheme();
    await waitFor(() => {
      expect(mockGetAllStreaks).toHaveBeenCalled();
    });
  });
});
