import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@/src/theme/ThemeContext';
import SleepScreen from '@/app/(tabs)/sleep';
import { SleepEntry } from '@/src/types';

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

let mockEntries: SleepEntry[] = [];
let mockIsLoading = false;
let mockError: string | null = null;

const mockLoadEntries = jest.fn();
const mockDeleteEntry = jest.fn();
const mockClearError = jest.fn();
const mockFetchSleepAnalysis = jest.fn();

jest.mock('@/src/store', () => ({
  useSleepStore: () => ({
    entries: mockEntries,
    isLoading: mockIsLoading,
    error: mockError,
    loadEntries: mockLoadEntries,
    deleteEntry: mockDeleteEntry,
    clearError: mockClearError,
  }),
  useAIInsightsStore: Object.assign(
    () => ({
      sleepAnalysis: null,
      isLoadingSleep: false,
      fetchSleepAnalysis: mockFetchSleepAnalysis,
    }),
    { setState: jest.fn() },
  ),
}));

function renderWithTheme() {
  return render(
    <ThemeProvider>
      <SleepScreen />
    </ThemeProvider>,
  );
}

const today = new Date().toISOString().split('T')[0];

function makeSleepEntry(overrides: Partial<SleepEntry> = {}): SleepEntry {
  return {
    id: 's1',
    date: today,
    bedtime: '2026-02-18T23:00:00.000Z',
    wakeTime: '2026-02-19T07:00:00.000Z',
    durationMinutes: 480,
    quality: 4 as const,
    createdAt: '2026-02-19T00:00:00.000Z',
    updatedAt: '2026-02-19T00:00:00.000Z',
    ...overrides,
  };
}

describe('SleepScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEntries = [];
    mockIsLoading = false;
    mockError = null;
    mockLoadEntries.mockResolvedValue(undefined);
    mockDeleteEntry.mockResolvedValue(undefined);
  });

  it('renders empty state when no sleep logged', async () => {
    const { findByText } = renderWithTheme();
    await findByText('No sleep logged');
    await findByText('Tap + to log your sleep');
  });

  it('renders a sleep entry card with quality badge', async () => {
    mockEntries = [makeSleepEntry()];
    const { findByText, findAllByText } = renderWithTheme();
    await findByText('Very Good');
    await findByText('Bedtime');
    await findByText('Wake');
    const durations = await findAllByText('Duration');
    expect(durations.length).toBeGreaterThanOrEqual(1);
  });

  it('renders 7-day summary when entries exist', async () => {
    mockEntries = [makeSleepEntry()];
    const { findByText } = renderWithTheme();
    await findByText('7-Day Average');
    await findByText('Quality /5');
    await findByText('Nights');
  });

  it('shows error banner when error exists', async () => {
    mockError = 'Failed to load sleep data';
    const { findByText } = renderWithTheme();
    await findByText('Failed to load sleep data');
  });

  it('calls loadEntries on mount', async () => {
    renderWithTheme();
    await waitFor(() => {
      expect(mockLoadEntries).toHaveBeenCalled();
    });
  });

  it('shows loading skeleton when loading with no entries', async () => {
    mockIsLoading = true;
    mockEntries = [];
    const { queryByText } = renderWithTheme();
    expect(queryByText('No sleep logged')).toBeNull();
  });

  it('shows quality badge on sleep entry', async () => {
    mockEntries = [makeSleepEntry({ quality: 5 })];
    const { findByText } = renderWithTheme();
    await findByText('Excellent');
  });
});
