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

jest.mock('react-native-reanimated', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  const React = require('react'); // eslint-disable-line @typescript-eslint/no-require-imports
  const stripAnimatedProps = (comp: React.ComponentType) =>
    // eslint-disable-next-line react/display-name
    React.forwardRef((props: Record<string, unknown>, ref: unknown) => {
      const { entering, exiting, ...rest } = props;
      return React.createElement(comp, { ...rest, ref });
    });
  const layoutAnim = () => {
    const b: Record<string, unknown> = {};
    b.duration = () => b;
    b.delay = () => b;
    b.springify = () => b;
    return b;
  };
  return {
    __esModule: true,
    default: { View: stripAnimatedProps(View), createAnimatedComponent: stripAnimatedProps },
    createAnimatedComponent: stripAnimatedProps,
    FadeInDown: layoutAnim(),
    FadeOut: layoutAnim(),
    useSharedValue: (v: number) => ({ value: v }),
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
    expect(await findByText('AI Health Coach')).toBeTruthy();
    expect(await findByText(/Add your Claude API key/)).toBeTruthy();
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
    expect(await findByText('Analyzing your health data...')).toBeTruthy();
  });

  it('shows error state when error occurs', async () => {
    mockHasKey = true;
    mockError = 'Network error';
    mockDailyCoaching = null;
    const { findByText } = renderWithTheme(<AICoaching />);
    expect(await findByText('Network error')).toBeTruthy();
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
    expect(await findByText('Good morning! Here are your insights.')).toBeTruthy();
    expect(await findByText('Habit Consistency')).toBeTruthy();
    expect(await findByText('You completed 80% of habits')).toBeTruthy();
    expect(await findByText('Sleep Quality')).toBeTruthy();
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
    expect(await findByText('Take a walk after lunch')).toBeTruthy();
    expect(await findByText('You are doing great!')).toBeTruthy();
  });

  it('fetches coaching on mount when API key exists', async () => {
    mockHasKey = true;
    renderWithTheme(<AICoaching />);
    await waitFor(() => {
      expect(mockFetchDailyCoaching).toHaveBeenCalled();
    });
  });
});
