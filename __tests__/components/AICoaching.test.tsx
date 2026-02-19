import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@/src/theme/ThemeContext';
import { AICoaching } from '@/src/components/dashboard/AICoaching';

let mockHasKey = false;
const mockFetchDailyCoaching = jest.fn();
let mockDailyCoaching: {
  greeting: string;
  insights: {
    category: string;
    title: string;
    insight: string;
    suggestion: string;
    priority: string;
  }[];
  dailyTip: string;
  motivationalMessage: string;
} | null = null;
let mockIsLoadingCoaching = false;
let mockError: string | null = null;

jest.mock('@/src/store', () => ({
  useAIInsightsStore: Object.assign(
    () => ({
      dailyCoaching: mockDailyCoaching,
      isLoadingCoaching: mockIsLoadingCoaching,
      error: mockError,
      fetchDailyCoaching: mockFetchDailyCoaching,
    }),
    { setState: jest.fn() },
  ),
}));

jest.mock('@/src/services/claude', () => ({
  hasApiKey: () => Promise.resolve(mockHasKey),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

jest.mock('react-native-reanimated', () => require('../helpers/reanimatedMock').reanimatedMock);

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('AICoaching', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHasKey = false;
    mockDailyCoaching = null;
    mockIsLoadingCoaching = false;
    mockError = null;
  });

  it('shows API key setup prompt when no key exists', async () => {
    mockHasKey = false;
    const { findByText } = renderWithTheme(<AICoaching />);
    await findByText('AI Health Coach');
    await findByText(/Add your Claude API key/);
  });

  it('shows Set Up API Key button when onSetupApiKey provided', async () => {
    mockHasKey = false;
    const onSetup = jest.fn();
    const { findByText } = renderWithTheme(<AICoaching onSetupApiKey={onSetup} />);
    const button = await findByText('Set Up API Key');
    fireEvent.press(button);
    expect(onSetup).toHaveBeenCalled();
  });

  it('shows loading state when fetching coaching', async () => {
    mockHasKey = true;
    mockIsLoadingCoaching = true;
    mockDailyCoaching = null;
    const { findByText } = renderWithTheme(<AICoaching />);
    await findByText('Analyzing your health data...');
  });

  it('shows error state when error occurs', async () => {
    mockHasKey = true;
    mockError = 'Network error';
    mockDailyCoaching = null;
    const { findByText } = renderWithTheme(<AICoaching />);
    await findByText('Network error');
  });

  it('renders coaching data with greeting and insights', async () => {
    mockHasKey = true;
    mockDailyCoaching = {
      greeting: 'Good morning! Here are your insights.',
      insights: [
        {
          category: 'habits',
          title: 'Habit Consistency',
          insight: 'You completed 80% of habits',
          suggestion: 'Try morning routines',
          priority: 'high',
        },
        {
          category: 'sleep',
          title: 'Sleep Quality',
          insight: 'Average 7h sleep',
          suggestion: 'Go to bed earlier',
          priority: 'medium',
        },
      ],
      dailyTip: 'Drink more water today!',
      motivationalMessage: 'Keep up the great work!',
    };
    const { findByText } = renderWithTheme(<AICoaching />);
    await findByText('Good morning! Here are your insights.');
    await findByText('Habit Consistency');
    await findByText('You completed 80% of habits');
    await findByText('Sleep Quality');
  });

  it('renders daily tip and motivational message', async () => {
    mockHasKey = true;
    mockDailyCoaching = {
      greeting: 'Hello!',
      insights: [],
      dailyTip: 'Take a walk after lunch',
      motivationalMessage: 'You are doing great!',
    };
    const { findByText } = renderWithTheme(<AICoaching />);
    await findByText('Take a walk after lunch');
    await findByText('You are doing great!');
  });

  it('fetches coaching on mount when API key exists', async () => {
    mockHasKey = true;
    renderWithTheme(<AICoaching />);
    await waitFor(() => {
      expect(mockFetchDailyCoaching).toHaveBeenCalled();
    });
  });
});
