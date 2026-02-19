import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ThemeProvider } from '@/src/theme/ThemeContext';
import { HabitSuggestionsModal } from '@/src/components/habits';

const mockCreateHabit = jest.fn();
const mockFetchHabitSuggestions = jest.fn();
let mockSuggestions: { name: string; description: string; reason: string; frequency: string }[] =
  [];
let mockIsLoading = false;

jest.mock('@/src/store', () => ({
  useHabitStore: () => ({
    createHabit: mockCreateHabit,
  }),
  useAIInsightsStore: () => ({
    habitSuggestions: mockSuggestions,
    isLoadingHabits: mockIsLoading,
    fetchHabitSuggestions: mockFetchHabitSuggestions,
  }),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  const createAnimatedComponent = (comp: unknown) => comp;
  return {
    __esModule: true,
    default: { View, createAnimatedComponent },
    createAnimatedComponent,
    FadeInDown: { duration: () => ({ delay: () => ({}) }) },
    useSharedValue: () => ({ value: 0 }),
    useAnimatedStyle: () => ({}),
    withTiming: (v: number) => v,
    withSpring: (v: number) => v,
    withSequence: (...args: number[]) => args[0],
    Easing: { inOut: () => ({}) },
  };
});

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('HabitSuggestionsModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSuggestions = [];
    mockIsLoading = false;
  });

  it('renders modal title', async () => {
    const { findByText } = renderWithTheme(
      <HabitSuggestionsModal visible={true} onClose={jest.fn()} />,
    );
    expect(await findByText('AI Suggestions')).toBeTruthy();
  });

  it('shows loading state', async () => {
    mockIsLoading = true;
    const { findByText } = renderWithTheme(
      <HabitSuggestionsModal visible={true} onClose={jest.fn()} />,
    );
    expect(await findByText('Analyzing your routine...')).toBeTruthy();
  });

  it('shows no suggestions message when empty', async () => {
    mockSuggestions = [];
    const { findByText } = renderWithTheme(
      <HabitSuggestionsModal visible={true} onClose={jest.fn()} />,
    );
    expect(await findByText('No suggestions available. Try refreshing.')).toBeTruthy();
  });

  it('renders suggestion cards', async () => {
    mockSuggestions = [
      {
        name: 'Morning Walk',
        description: '30 min walk',
        reason: 'Great for health',
        frequency: 'daily',
      },
      {
        name: 'Reading',
        description: 'Read 20 pages',
        reason: 'Builds knowledge',
        frequency: 'daily',
      },
    ];
    const { findByText } = renderWithTheme(
      <HabitSuggestionsModal visible={true} onClose={jest.fn()} />,
    );
    expect(await findByText('Morning Walk')).toBeTruthy();
    expect(await findByText('30 min walk')).toBeTruthy();
    expect(await findByText('Reading')).toBeTruthy();
  });

  it('creates habit when Add This Habit is pressed', async () => {
    mockCreateHabit.mockResolvedValue({ id: '1' });
    jest.spyOn(Alert, 'alert');
    mockSuggestions = [
      { name: 'Yoga', description: 'Daily yoga', reason: 'Flexibility', frequency: 'daily' },
    ];
    const { findAllByText } = renderWithTheme(
      <HabitSuggestionsModal visible={true} onClose={jest.fn()} />,
    );
    const addButtons = await findAllByText('Add This Habit');
    fireEvent.press(addButtons[0]);
    expect(mockCreateHabit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Yoga', frequency: 'daily' }),
    );
  });

  it('calls fetchHabitSuggestions when Get New Suggestions pressed', async () => {
    const { findByText } = renderWithTheme(
      <HabitSuggestionsModal visible={true} onClose={jest.fn()} />,
    );
    fireEvent.press(await findByText('Get New Suggestions'));
    expect(mockFetchHabitSuggestions).toHaveBeenCalled();
  });
});
