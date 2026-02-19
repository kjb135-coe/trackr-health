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
const mockUpdateSession = jest.fn();
jest.mock('@/src/store', () => ({
  useExerciseStore: () => ({
    createSession: mockCreateSession,
    updateSession: mockUpdateSession,
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

  it('shows alert for invalid calories', async () => {
    const { findByText, findByDisplayValue, findByPlaceholderText } = renderWithTheme(
      <ExerciseLogModal visible={true} onClose={() => {}} />,
    );

    const caloriesInput = await findByPlaceholderText('200');
    fireEvent.changeText(caloriesInput, '-50');

    fireEvent.press(await findByText('Save Workout'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Invalid calories',
      'Calories must be a positive number.',
    );
    expect(mockCreateSession).not.toHaveBeenCalled();
  });

  it('shows edit title and pre-fills form when editSession is provided', async () => {
    const editSession = {
      id: 'session-1',
      date: '2026-02-18',
      type: 'cycling' as const,
      durationMinutes: 60,
      intensity: 'high' as const,
      caloriesBurned: 500,
      createdAt: '2026-02-18T08:00:00.000Z',
      updatedAt: '2026-02-18T08:00:00.000Z',
    };

    const { findByText, findByDisplayValue } = renderWithTheme(
      <ExerciseLogModal visible={true} onClose={() => {}} editSession={editSession} />,
    );

    expect(await findByText('Edit Exercise')).toBeTruthy();
    expect(await findByText('Update Workout')).toBeTruthy();
    expect(await findByDisplayValue('60')).toBeTruthy();
    expect(await findByDisplayValue('500')).toBeTruthy();
  });

  it('calls updateSession when saving in edit mode', async () => {
    mockUpdateSession.mockResolvedValue(undefined);
    const onClose = jest.fn();

    const editSession = {
      id: 'session-1',
      date: '2026-02-18',
      type: 'running' as const,
      durationMinutes: 30,
      intensity: 'moderate' as const,
      caloriesBurned: 250,
      createdAt: '2026-02-18T08:00:00.000Z',
      updatedAt: '2026-02-18T08:00:00.000Z',
    };

    const { findByText } = renderWithTheme(
      <ExerciseLogModal visible={true} onClose={onClose} editSession={editSession} />,
    );

    fireEvent.press(await findByText('Update Workout'));

    await waitFor(() => {
      expect(mockUpdateSession).toHaveBeenCalledWith(
        'session-1',
        expect.objectContaining({
          type: 'running',
          durationMinutes: 30,
          intensity: 'moderate',
          caloriesBurned: 250,
        }),
      );
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('shows error alert when save fails', async () => {
    mockCreateSession.mockRejectedValueOnce(new Error('Network error'));

    const { findByText } = renderWithTheme(<ExerciseLogModal visible={true} onClose={() => {}} />);

    fireEvent.press(await findByText('Save Workout'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Save failed', 'Network error');
    });
  });
});
