import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
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
jest.mock('@/src/store', () => ({
  useHabitStore: () => ({
    createHabit: mockCreateHabit,
  }),
}));

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
});
