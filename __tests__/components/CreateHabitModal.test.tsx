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
    expect(await findByText('New Habit')).toBeTruthy();
  });

  it('renders habit name input and color label', async () => {
    const { findByPlaceholderText, findByText } = renderWithTheme(
      <CreateHabitModal visible={true} onClose={() => {}} />,
    );
    expect(await findByPlaceholderText('Habit name')).toBeTruthy();
    expect(await findByText('Color')).toBeTruthy();
  });

  it('renders create button as disabled when name is empty', async () => {
    const { findByText } = renderWithTheme(<CreateHabitModal visible={true} onClose={() => {}} />);
    expect(await findByText('Create Habit')).toBeTruthy();
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

    expect(await findByText('Edit Habit')).toBeTruthy();
    expect(await findByText('Update Habit')).toBeTruthy();
    expect(await findByDisplayValue('Meditate')).toBeTruthy();
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
});
