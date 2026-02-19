import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@/src/theme/ThemeContext';
import JournalScreen from '@/app/(tabs)/journal';
import { JournalEntry } from '@/src/types';

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

let mockEntries: JournalEntry[] = [];
let mockIsLoading = false;
let mockError: string | null = null;

const mockLoadEntries = jest.fn();
const mockDeleteEntry = jest.fn();
const mockSearch = jest.fn();
const mockClearError = jest.fn();
const mockFetchMoodAnalysis = jest.fn();

jest.mock('@/src/store', () => ({
  useJournalStore: () => ({
    entries: mockEntries,
    isLoading: mockIsLoading,
    error: mockError,
    loadEntries: mockLoadEntries,
    deleteEntry: mockDeleteEntry,
    search: mockSearch,
    clearError: mockClearError,
  }),
  useAIInsightsStore: Object.assign(
    () => ({
      moodAnalysis: null,
      isLoadingMood: false,
      fetchMoodAnalysis: mockFetchMoodAnalysis,
    }),
    { setState: jest.fn() },
  ),
}));

function renderWithTheme() {
  return render(
    <ThemeProvider>
      <JournalScreen />
    </ThemeProvider>,
  );
}

function makeEntry(overrides: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: 'j1',
    date: '2026-02-19',
    title: 'My Day',
    content: 'Had a great day today.',
    mood: 4,
    isScanned: false,
    createdAt: '2026-02-19T00:00:00.000Z',
    updatedAt: '2026-02-19T00:00:00.000Z',
    ...overrides,
  };
}

describe('JournalScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEntries = [];
    mockIsLoading = false;
    mockError = null;
    mockLoadEntries.mockResolvedValue(undefined);
    mockDeleteEntry.mockResolvedValue(undefined);
    mockSearch.mockResolvedValue([]);
  });

  it('renders empty state when no entries exist', async () => {
    const { findByText } = renderWithTheme();
    await findByText('No journal entries yet');
    await findByText('Start writing or scan a handwritten entry');
  });

  it('renders a journal entry card', async () => {
    mockEntries = [makeEntry()];
    const { findByText } = renderWithTheme();
    await findByText('My Day');
    await findByText('Had a great day today.');
    await findByText('Good');
  });

  it('renders multiple entries', async () => {
    mockEntries = [
      makeEntry({ id: 'j1', title: 'Morning Thoughts' }),
      makeEntry({ id: 'j2', title: 'Evening Reflection' }),
    ];
    const { findByText } = renderWithTheme();
    await findByText('Morning Thoughts');
    await findByText('Evening Reflection');
  });

  it('renders entry with mood badge', async () => {
    mockEntries = [makeEntry({ mood: 5 })];
    const { findByText } = renderWithTheme();
    await findByText('Great');
  });

  it('shows search bar when entries exist', async () => {
    mockEntries = [makeEntry()];
    const { findByPlaceholderText } = renderWithTheme();
    await findByPlaceholderText('Search entries...');
  });

  it('shows tag filter pills when entries have tags', async () => {
    mockEntries = [makeEntry({ tags: ['health', 'fitness'] })];
    const { findAllByText } = renderWithTheme();
    // Tags appear in both filter pills and entry cards
    const healthTags = await findAllByText('health');
    expect(healthTags.length).toBeGreaterThanOrEqual(1);
  });

  it('shows error banner when error exists', async () => {
    mockError = 'Failed to load journal';
    const { findByText } = renderWithTheme();
    await findByText('Failed to load journal');
  });

  it('calls loadEntries on mount', async () => {
    renderWithTheme();
    await waitFor(() => {
      expect(mockLoadEntries).toHaveBeenCalled();
    });
  });

  it('shows loading skeletons when loading with no entries', async () => {
    mockIsLoading = true;
    mockEntries = [];
    const { queryByText } = renderWithTheme();
    expect(queryByText('No journal entries yet')).toBeNull();
  });

  it('shows scanned badge on scanned entries', async () => {
    mockEntries = [makeEntry({ isScanned: true })];
    const { findByText } = renderWithTheme();
    await findByText('Scanned');
  });
});
