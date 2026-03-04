import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import LogSleepScreen from '@/app/sleep/log';

jest.mock('react-native-reanimated', () => require('../helpers/reanimatedMock').reanimatedMock);

jest.mock('@/src/theme/ThemeContext', () => {
  const actual = jest.requireActual('@/src/theme/ThemeContext');
  return {
    ...actual,
    useTheme: () => ({
      colors: actual.lightColors,
      isDark: false,
      mode: 'light',
      setMode: jest.fn(),
    }),
  };
});

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success', Error: 'error' },
}));

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
}));

const mockCreateEntry = jest.fn();
jest.mock('@/src/store', () => ({
  useSleepStore: () => ({
    createEntry: mockCreateEntry,
  }),
}));

jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => <View testID="date-time-picker" {...props} />,
  };
});

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return {
    Moon: (props: Record<string, unknown>) => <View testID="moon-icon" {...props} />,
    Star: (props: Record<string, unknown>) => <View testID="star-icon" {...props} />,
    X: (props: Record<string, unknown>) => <View testID="x-icon" {...props} />,
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('LogSleepScreen', () => {
  it('renders title and section headers', () => {
    const { getByText } = render(<LogSleepScreen />);
    expect(getByText('Log Sleep')).toBeTruthy();
    expect(getByText('Total Sleep')).toBeTruthy();
    expect(getByText('Sleep Quality')).toBeTruthy();
    expect(getByText('Factors Affecting Sleep')).toBeTruthy();
    expect(getByText('Notes')).toBeTruthy();
  });

  it('renders bedtime and wake time labels', () => {
    const { getByText } = render(<LogSleepScreen />);
    expect(getByText('Bedtime')).toBeTruthy();
    expect(getByText('Wake Time')).toBeTruthy();
  });

  it('shows default sleep duration of 9h 0m', () => {
    // Default bedtime 22:00, wake 07:00 = 9 hours
    const { getByText } = render(<LogSleepScreen />);
    expect(getByText('9h 0m')).toBeTruthy();
  });

  it('shows default quality label "Good" (quality=3)', () => {
    const { getByText } = render(<LogSleepScreen />);
    expect(getByText('Good')).toBeTruthy();
  });

  it('renders all 6 sleep factor chips', () => {
    const { getByText } = render(<LogSleepScreen />);
    expect(getByText('Caffeine')).toBeTruthy();
    expect(getByText('Alcohol')).toBeTruthy();
    expect(getByText('Exercise')).toBeTruthy();
    expect(getByText('Screen time')).toBeTruthy();
    expect(getByText('Stress')).toBeTruthy();
    expect(getByText('Nap')).toBeTruthy();
  });

  it('renders save button', () => {
    const { getByText } = render(<LogSleepScreen />);
    expect(getByText('Save Sleep Entry')).toBeTruthy();
  });

  it('saves sleep entry and navigates back on success', async () => {
    mockCreateEntry.mockResolvedValueOnce(undefined);
    const { getByText } = render(<LogSleepScreen />);

    fireEvent.press(getByText('Save Sleep Entry'));

    await waitFor(
      () => {
        expect(mockCreateEntry).toHaveBeenCalledWith(
          expect.objectContaining({
            quality: 3,
            factors: [],
          }),
        );
      },
      { timeout: 5000 },
    );

    await waitFor(
      () => {
        expect(mockBack).toHaveBeenCalled();
      },
      { timeout: 5000 },
    );
  });

  it('shows error alert on save failure', async () => {
    jest.spyOn(Alert, 'alert');
    mockCreateEntry.mockRejectedValueOnce(new Error('Database error'));
    const { getByText } = render(<LogSleepScreen />);

    fireEvent.press(getByText('Save Sleep Entry'));

    await waitFor(
      () => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Database error');
      },
      { timeout: 5000 },
    );
  });

  it('navigates back when close button is pressed', () => {
    const { getByTestId } = render(<LogSleepScreen />);
    fireEvent.press(getByTestId('x-icon'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('shows notes placeholder text', () => {
    const { getByPlaceholderText } = render(<LogSleepScreen />);
    expect(getByPlaceholderText('How did you sleep? Any dreams?')).toBeTruthy();
  });
});
