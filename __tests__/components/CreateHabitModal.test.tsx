import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ThemeProvider } from '@/src/theme/ThemeContext';
import { CreateHabitModal } from '@/src/components/habits/CreateHabitModal';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockCreateHabit = jest.fn();
const mockUpdateHabit = jest.fn();
jest.mock('@/src/store', () => ({
  useHabitStore: () => ({
    createHabit: mockCreateHabit,
    updateHabit: mockUpdateHabit,
  }),
}));

const mockScheduleHabitReminder = jest.fn();
const mockCancelHabitReminder = jest.fn();
jest.mock('@/src/services/notifications', () => ({
  scheduleHabitReminder: (...args: unknown[]) => mockScheduleHabitReminder(...args),
  cancelHabitReminder: (...args: unknown[]) => mockCancelHabitReminder(...args),
}));

jest.spyOn(Alert, 'alert');

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('CreateHabitModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal title when visible', async () => {
    const { findByText } = renderWithTheme(<CreateHabitModal visible={true} onClose={() => {}} />);
    await findByText('New Habit');
  });

  it('renders habit name input and color label', async () => {
    const { findByPlaceholderText, findByText } = renderWithTheme(
      <CreateHabitModal visible={true} onClose={() => {}} />,
    );
    await findByPlaceholderText('Habit name');
    await findByText('Color');
  });

  it('renders create button as disabled when name is empty', async () => {
    const { findByText } = renderWithTheme(<CreateHabitModal visible={true} onClose={() => {}} />);
    await findByText('Create Habit');
  });

  it('calls createHabit and onClose when form is submitted', async () => {
    mockCreateHabit.mockResolvedValue(undefined);
    const onClose = jest.fn();

    const { findByPlaceholderText, findByText } = renderWithTheme(
      <CreateHabitModal visible={true} onClose={onClose} />,
    );

    const input = await findByPlaceholderText('Habit name');
    fireEvent.changeText(input, 'New habit');

    const createButton = await findByText('Create Habit');
    fireEvent.press(createButton);

    await waitFor(() => {
      expect(mockCreateHabit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New habit',
          frequency: 'daily',
          reminderTime: null,
        }),
      );
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('does not create habit with empty name', async () => {
    const onClose = jest.fn();

    const { findByText } = renderWithTheme(<CreateHabitModal visible={true} onClose={onClose} />);

    const createButton = await findByText('Create Habit');
    fireEvent.press(createButton);

    expect(mockCreateHabit).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows edit title and pre-fills name when editHabit is provided', async () => {
    const editHabit = {
      id: 'h1',
      name: 'Meditate',
      color: '#8B5CF6',
      frequency: 'daily' as const,
      createdAt: '2026-02-18T00:00:00.000Z',
      updatedAt: '2026-02-18T00:00:00.000Z',
    };

    const { findByText, findByDisplayValue } = renderWithTheme(
      <CreateHabitModal visible={true} onClose={() => {}} editHabit={editHabit} />,
    );

    await findByText('Edit Habit');
    await findByText('Update Habit');
    await findByDisplayValue('Meditate');
  });

  it('calls updateHabit when saving in edit mode', async () => {
    mockUpdateHabit.mockResolvedValue(undefined);
    const onClose = jest.fn();

    const editHabit = {
      id: 'h1',
      name: 'Meditate',
      color: '#8B5CF6',
      frequency: 'daily' as const,
      createdAt: '2026-02-18T00:00:00.000Z',
      updatedAt: '2026-02-18T00:00:00.000Z',
    };

    const { findByText } = renderWithTheme(
      <CreateHabitModal visible={true} onClose={onClose} editHabit={editHabit} />,
    );

    fireEvent.press(await findByText('Update Habit'));

    await waitFor(() => {
      expect(mockUpdateHabit).toHaveBeenCalledWith('h1', {
        name: 'Meditate',
        color: '#8B5CF6',
        reminderTime: null,
      });
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('shows error alert when save fails', async () => {
    mockCreateHabit.mockRejectedValueOnce(new Error('Save error'));

    const { findByPlaceholderText, findByText } = renderWithTheme(
      <CreateHabitModal visible={true} onClose={() => {}} />,
    );

    fireEvent.changeText(await findByPlaceholderText('Habit name'), 'Test');
    fireEvent.press(await findByText('Create Habit'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Save failed', 'Save error');
    });
  });

  it('renders daily reminder toggle', async () => {
    const { findByText } = renderWithTheme(<CreateHabitModal visible={true} onClose={() => {}} />);
    await findByText('Daily Reminder');
  });

  it('shows time inputs when reminder is enabled', async () => {
    const editHabit = {
      id: 'h1',
      name: 'Meditate',
      color: '#8B5CF6',
      frequency: 'daily' as const,
      reminderTime: '09:30',
      createdAt: '2026-02-18T00:00:00.000Z',
      updatedAt: '2026-02-18T00:00:00.000Z',
    };

    const { findByDisplayValue } = renderWithTheme(
      <CreateHabitModal visible={true} onClose={() => {}} editHabit={editHabit} />,
    );

    await findByDisplayValue('09');
    await findByDisplayValue('30');
  });

  it('schedules reminder when creating habit with reminder enabled', async () => {
    const created = {
      id: 'h-new',
      name: 'Read',
      color: '#10B981',
      frequency: 'daily',
      reminderTime: '09:00',
      createdAt: '2026-02-19T00:00:00.000Z',
      updatedAt: '2026-02-19T00:00:00.000Z',
    };
    mockCreateHabit.mockResolvedValue(created);
    const onClose = jest.fn();

    const { findByPlaceholderText, findByText, findByTestId } = renderWithTheme(
      <CreateHabitModal visible={true} onClose={onClose} />,
    );

    fireEvent.changeText(await findByPlaceholderText('Habit name'), 'Read');

    // Enable reminder toggle
    const toggle = await findByTestId('reminder-toggle');
    fireEvent(toggle, 'valueChange', true);

    fireEvent.press(await findByText('Create Habit'));

    await waitFor(() => {
      expect(mockCreateHabit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Read',
          reminderTime: '09:00',
        }),
      );
    });

    await waitFor(() => {
      expect(mockScheduleHabitReminder).toHaveBeenCalledWith(created);
    });
  });

  it('cancels reminder when editing habit to disable reminder', async () => {
    mockUpdateHabit.mockResolvedValue(undefined);
    const onClose = jest.fn();

    const editHabit = {
      id: 'h1',
      name: 'Meditate',
      color: '#8B5CF6',
      frequency: 'daily' as const,
      reminderTime: '09:30',
      createdAt: '2026-02-18T00:00:00.000Z',
      updatedAt: '2026-02-18T00:00:00.000Z',
    };

    const { findByText, findByTestId } = renderWithTheme(
      <CreateHabitModal visible={true} onClose={onClose} editHabit={editHabit} />,
    );

    // Disable reminder toggle
    const toggle = await findByTestId('reminder-toggle');
    fireEvent(toggle, 'valueChange', false);

    fireEvent.press(await findByText('Update Habit'));

    await waitFor(() => {
      expect(mockUpdateHabit).toHaveBeenCalledWith('h1', {
        name: 'Meditate',
        color: '#8B5CF6',
        reminderTime: null,
      });
    });

    await waitFor(() => {
      expect(mockCancelHabitReminder).toHaveBeenCalledWith('h1');
    });
  });

  it('shows alert for invalid reminder time', async () => {
    const editHabit = {
      id: 'h1',
      name: 'Meditate',
      color: '#8B5CF6',
      frequency: 'daily' as const,
      reminderTime: '09:30',
      createdAt: '2026-02-18T00:00:00.000Z',
      updatedAt: '2026-02-18T00:00:00.000Z',
    };

    const { findByDisplayValue, findByText } = renderWithTheme(
      <CreateHabitModal visible={true} onClose={() => {}} editHabit={editHabit} />,
    );

    const hourInput = await findByDisplayValue('09');
    fireEvent.changeText(hourInput, '25');

    fireEvent.press(await findByText('Update Habit'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Invalid time',
        'Hours must be 0-23 and minutes 0-59.',
      );
    });
    expect(mockUpdateHabit).not.toHaveBeenCalled();
  });
});
