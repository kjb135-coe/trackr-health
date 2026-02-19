import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ThemeProvider } from '@/src/theme/ThemeContext';
import { ExerciseLogModal } from '@/src/components/exercise/ExerciseLogModal';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockCreateSession = jest.fn();
jest.mock('@/src/store', () => ({
  useExerciseStore: () => ({
    createSession: mockCreateSession,
  }),
}));

jest.spyOn(Alert, 'alert');

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('ExerciseLogModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal title when visible', async () => {
    const { findByText } = renderWithTheme(<ExerciseLogModal visible={true} onClose={() => {}} />);
    expect(await findByText('Log Exercise')).toBeTruthy();
  });

  it('renders exercise type and intensity labels', async () => {
    const { findByText } = renderWithTheme(<ExerciseLogModal visible={true} onClose={() => {}} />);
    expect(await findByText('Exercise Type')).toBeTruthy();
    expect(await findByText('Intensity')).toBeTruthy();
    expect(await findByText('Duration (minutes)')).toBeTruthy();
  });

  it('renders save button', async () => {
    const { findByText } = renderWithTheme(<ExerciseLogModal visible={true} onClose={() => {}} />);
    expect(await findByText('Save Workout')).toBeTruthy();
  });

  it('calls createSession and onClose when form is submitted', async () => {
    mockCreateSession.mockResolvedValue(undefined);
    const onClose = jest.fn();

    const { findByText } = renderWithTheme(<ExerciseLogModal visible={true} onClose={onClose} />);

    const saveButton = await findByText('Save Workout');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockCreateSession).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'running',
          durationMinutes: 30,
          intensity: 'moderate',
        }),
      );
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('shows alert for zero duration', async () => {
    const onClose = jest.fn();

    const { findByText, findByDisplayValue } = renderWithTheme(
      <ExerciseLogModal visible={true} onClose={onClose} />,
    );

    const durationInput = await findByDisplayValue('30');
    fireEvent.changeText(durationInput, '0');

    const saveButton = await findByText('Save Workout');
    fireEvent.press(saveButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Invalid duration',
      'Please enter a duration greater than 0 minutes.',
    );
    expect(mockCreateSession).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('applies preFill values when provided', async () => {
    mockCreateSession.mockResolvedValue(undefined);
    const onClose = jest.fn();

    const { findByText, findByDisplayValue } = renderWithTheme(
      <ExerciseLogModal
        visible={true}
        onClose={onClose}
        preFill={{ duration: '45', calories: '300', intensity: 'high' }}
      />,
    );

    // Verify pre-fill values are applied
    expect(await findByDisplayValue('45')).toBeTruthy();
    expect(await findByDisplayValue('300')).toBeTruthy();

    const saveButton = await findByText('Save Workout');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockCreateSession).toHaveBeenCalledWith(
        expect.objectContaining({
          durationMinutes: 45,
          intensity: 'high',
          caloriesBurned: 300,
        }),
      );
    });
  });
});
