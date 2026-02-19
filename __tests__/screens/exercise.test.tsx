import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@/src/theme/ThemeContext';
import ExerciseScreen from '@/app/(tabs)/exercise';
import { ExerciseSession } from '@/src/types';

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

let mockSessions: ExerciseSession[] = [];
let mockIsLoading = false;
let mockError: string | null = null;

const mockLoadSessions = jest.fn();
const mockDeleteSession = jest.fn();
const mockClearError = jest.fn();
const mockFetchExerciseRecommendation = jest.fn();

jest.mock('@/src/store', () => ({
  useExerciseStore: () => ({
    sessions: mockSessions,
    isLoading: mockIsLoading,
    error: mockError,
    loadSessions: mockLoadSessions,
    deleteSession: mockDeleteSession,
    clearError: mockClearError,
  }),
  useAIInsightsStore: Object.assign(
    () => ({
      exerciseRecommendation: null,
      isLoadingExercise: false,
      fetchExerciseRecommendation: mockFetchExerciseRecommendation,
    }),
    { setState: jest.fn() },
  ),
}));

function renderWithTheme() {
  return render(
    <ThemeProvider>
      <ExerciseScreen />
    </ThemeProvider>,
  );
}

const today = new Date().toISOString().split('T')[0];

function makeSession(overrides: Partial<ExerciseSession> = {}): ExerciseSession {
  return {
    id: 'e1',
    date: today,
    type: 'running',
    durationMinutes: 30,
    intensity: 'moderate',
    caloriesBurned: 300,
    createdAt: '2026-02-19T00:00:00.000Z',
    updatedAt: '2026-02-19T00:00:00.000Z',
    ...overrides,
  };
}

describe('ExerciseScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSessions = [];
    mockIsLoading = false;
    mockError = null;
    mockLoadSessions.mockResolvedValue(undefined);
    mockDeleteSession.mockResolvedValue(undefined);
  });

  it('renders empty state when no workouts exist', async () => {
    const { findByText } = renderWithTheme();
    await findByText('No workouts');
    await findByText('Tap + to log your exercise');
  });

  it('renders a workout card with type and stats', async () => {
    mockSessions = [makeSession()];
    const { findByText } = renderWithTheme();
    await findByText('Running');
    await findByText('Moderate');
    await findByText('Intensity');
  });

  it('renders multiple workout cards', async () => {
    mockSessions = [
      makeSession({ id: 'e1', type: 'running' }),
      makeSession({ id: 'e2', type: 'yoga', durationMinutes: 60, intensity: 'low' }),
    ];
    const { findByText } = renderWithTheme();
    await findByText('Running');
    await findByText('Yoga');
  });

  it('renders 7-day summary when sessions exist', async () => {
    mockSessions = [makeSession()];
    const { findByText } = renderWithTheme();
    await findByText('7-Day Activity');
    await findByText('Workouts');
    await findByText('Total Time');
  });

  it('shows error banner when error exists', async () => {
    mockError = 'Failed to load sessions';
    const { findByText } = renderWithTheme();
    await findByText('Failed to load sessions');
  });

  it('calls loadSessions on mount', async () => {
    renderWithTheme();
    await waitFor(() => {
      expect(mockLoadSessions).toHaveBeenCalled();
    });
  });

  it('shows loading skeletons when loading with no sessions', async () => {
    mockIsLoading = true;
    mockSessions = [];
    const { queryByText } = renderWithTheme();
    expect(queryByText('No workouts')).toBeNull();
  });
});
