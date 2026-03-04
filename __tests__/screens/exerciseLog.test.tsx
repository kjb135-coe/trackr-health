import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import LogExerciseScreen from '@/app/exercise/log';

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
  NotificationFeedbackType: { Success: 'success' },
}));

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
}));

const mockCreateSession = jest.fn();
jest.mock('@/src/store', () => ({
  useExerciseStore: () => ({
    createSession: mockCreateSession,
  }),
}));

jest.mock('@react-native-community/slider', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => <View testID="slider" {...props} />,
  };
});

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return {
    X: (props: Record<string, unknown>) => <View testID="x-icon" {...props} />,
    Clock: (props: Record<string, unknown>) => <View testID="clock-icon" {...props} />,
    Flame: (props: Record<string, unknown>) => <View testID="flame-icon" {...props} />,
    Zap: (props: Record<string, unknown>) => <View testID="zap-icon" {...props} />,
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('LogExerciseScreen', () => {
  it('renders title and section headers', () => {
    const { getByText } = render(<LogExerciseScreen />);
    expect(getByText('Log Workout')).toBeTruthy();
    expect(getByText('Exercise Type')).toBeTruthy();
    expect(getByText('Duration')).toBeTruthy();
    expect(getByText('Intensity')).toBeTruthy();
    expect(getByText('Notes')).toBeTruthy();
  });

  it('renders all 8 exercise type buttons', () => {
    const { getByText } = render(<LogExerciseScreen />);
    expect(getByText('Running')).toBeTruthy();
    expect(getByText('Cycling')).toBeTruthy();
    expect(getByText('Swimming')).toBeTruthy();
    expect(getByText('Weights')).toBeTruthy();
    expect(getByText('Yoga')).toBeTruthy();
    expect(getByText('HIIT')).toBeTruthy();
    expect(getByText('Walking')).toBeTruthy();
    expect(getByText('Other')).toBeTruthy();
  });

  it('renders 5 intensity level buttons', () => {
    const { getByText } = render(<LogExerciseScreen />);
    expect(getByText('1')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
    expect(getByText('3')).toBeTruthy();
    expect(getByText('4')).toBeTruthy();
    expect(getByText('5')).toBeTruthy();
  });

  it('shows default intensity label "Intense"', () => {
    const { getByText } = render(<LogExerciseScreen />);
    // Default intensity is 3, which maps to 'Intense' (INTENSITY_LABELS[2])
    expect(getByText('Intense')).toBeTruthy();
  });

  it('shows calorie estimate after selecting exercise type', () => {
    const { getByText } = render(<LogExerciseScreen />);
    fireEvent.press(getByText('Running'));
    // Should show estimated calories card
    expect(getByText('estimated calories')).toBeTruthy();
  });

  it('does not show calorie estimate before selecting type', () => {
    const { queryByText } = render(<LogExerciseScreen />);
    expect(queryByText('estimated calories')).toBeNull();
  });

  it('shows validation error when saving without selecting type', () => {
    jest.spyOn(Alert, 'alert');
    const { getByText } = render(<LogExerciseScreen />);
    fireEvent.press(getByText('Save Workout'));
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please select an exercise type');
    expect(mockCreateSession).not.toHaveBeenCalled();
  });

  it('saves workout and navigates back on success', async () => {
    mockCreateSession.mockResolvedValueOnce(undefined);
    const { getByText } = render(<LogExerciseScreen />);

    fireEvent.press(getByText('Running'));
    fireEvent.press(getByText('Save Workout'));

    await waitFor(
      () => {
        expect(mockCreateSession).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'running',
            durationMinutes: 30,
            intensity: 'moderate',
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
    mockCreateSession.mockRejectedValueOnce(new Error('Database error'));
    const { getByText } = render(<LogExerciseScreen />);

    fireEvent.press(getByText('Running'));
    fireEvent.press(getByText('Save Workout'));

    await waitFor(
      () => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Database error');
      },
      { timeout: 5000 },
    );
  });

  it('navigates back when close button is pressed', () => {
    const { getByTestId } = render(<LogExerciseScreen />);
    // The close button contains the X icon
    const xIcon = getByTestId('x-icon');
    // Press the parent TouchableOpacity
    fireEvent.press(xIcon);
    expect(mockBack).toHaveBeenCalled();
  });

  it('shows notes placeholder text', () => {
    const { getByPlaceholderText } = render(<LogExerciseScreen />);
    expect(getByPlaceholderText('How was your workout?')).toBeTruthy();
  });

  it('changes intensity label when pressing intensity buttons', () => {
    const { getByText } = render(<LogExerciseScreen />);
    // Default is 3 → "Intense"
    expect(getByText('Intense')).toBeTruthy();
    // Press level 1 → "Light"
    fireEvent.press(getByText('1'));
    expect(getByText('Light')).toBeTruthy();
    // Press level 5 → "Maximum"
    fireEvent.press(getByText('5'));
    expect(getByText('Maximum')).toBeTruthy();
  });

  it('allows entering notes text', () => {
    const { getByPlaceholderText } = render(<LogExerciseScreen />);
    const input = getByPlaceholderText('How was your workout?');
    fireEvent.changeText(input, 'Great run today');
    expect(input.props.value).toBe('Great run today');
  });

  it('shows alert when duration is zero', () => {
    jest.spyOn(Alert, 'alert');
    const { getByText, getByTestId } = render(<LogExerciseScreen />);

    // Select a type first so it passes the type check
    fireEvent.press(getByText('Running'));

    // Set duration to 0 via slider onValueChange
    const slider = getByTestId('slider');
    fireEvent(slider, 'onValueChange', 0);

    fireEvent.press(getByText('Save Workout'));

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Duration must be at least 1 minute');
    expect(mockCreateSession).not.toHaveBeenCalled();
  });
});
