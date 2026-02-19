import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ThemeProvider } from '@/src/theme/ThemeContext';
import GoalsScreen from '@/app/goals';

jest.mock('react-native-reanimated', () => require('../helpers/reanimatedMock').reanimatedMock);

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success' },
}));

jest.mock('@react-native-community/slider', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,

    default: (props: Record<string, unknown>) => <View testID="slider" {...props} />,
  };
});

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
}));

const mockLoadGoals = jest.fn();
const mockUpdateGoals = jest.fn();
let mockIsLoading = false;
let mockGoals = {
  sleepHours: 8,
  exerciseMinutesPerWeek: 150,
  dailyCalories: 2000,
  dailyProtein: 100,
  habitsPerDay: 5,
  journalEntriesPerWeek: 3,
};

jest.mock('@/src/store', () => ({
  useGoalsStore: () => ({
    goals: mockGoals,
    loadGoals: mockLoadGoals,
    updateGoals: mockUpdateGoals,
    isLoading: mockIsLoading,
  }),
}));

jest.spyOn(Alert, 'alert');

function renderWithTheme() {
  return render(
    <ThemeProvider>
      <GoalsScreen />
    </ThemeProvider>,
  );
}

describe('GoalsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsLoading = false;
    mockGoals = {
      sleepHours: 8,
      exerciseMinutesPerWeek: 150,
      dailyCalories: 2000,
      dailyProtein: 100,
      habitsPerDay: 5,
      journalEntriesPerWeek: 3,
    };
    mockLoadGoals.mockResolvedValue(undefined);
    mockUpdateGoals.mockResolvedValue(undefined);
  });

  it('renders screen title and description', async () => {
    const { findByText } = renderWithTheme();
    await findByText('Your Goals');
    await findByText('Set personalized targets for each area of your health journey.');
  });

  it('renders all 6 goal cards', async () => {
    const { findByText } = renderWithTheme();
    await findByText('Daily Sleep');
    await findByText('Weekly Exercise');
    await findByText('Daily Calories');
    await findByText('Daily Protein');
    await findByText('Daily Habits');
    await findByText('Weekly Journal');
  });

  it('displays current goal values', async () => {
    const { findByText } = renderWithTheme();
    await findByText('8 hours');
    await findByText('150 min/week');
    await findByText('2000 cal');
    await findByText('100g');
    await findByText('5 habits');
    await findByText('3 entries/week');
  });

  it('calls loadGoals on mount', async () => {
    renderWithTheme();
    await waitFor(() => {
      expect(mockLoadGoals).toHaveBeenCalled();
    });
  });

  it('renders save button', async () => {
    const { findByText } = renderWithTheme();
    await findByText('Save Goals');
  });

  it('shows error alert when save fails', async () => {
    mockUpdateGoals.mockRejectedValue(new Error('Storage full'));
    const { findByText, getByText } = renderWithTheme();
    await findByText('Save Goals');
    fireEvent.press(getByText('Save Goals'));
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Save Failed', 'Storage full');
    });
  });

  it('navigates back on successful save', async () => {
    const { findByText, getByText } = renderWithTheme();
    await findByText('Save Goals');
    fireEvent.press(getByText('Save Goals'));
    await waitFor(() => {
      expect(mockUpdateGoals).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(mockBack).toHaveBeenCalled();
    });
  });
});
