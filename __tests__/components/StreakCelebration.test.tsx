import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '@/src/theme/ThemeContext';
import { StreakCelebration } from '@/src/components/habits/StreakCelebration';

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  NotificationFeedbackType: { Success: 'success' },
}));

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('StreakCelebration', () => {
  const defaultProps = {
    visible: true,
    streak: 7,
    habitName: 'Morning Meditation',
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null for non-milestone streaks', async () => {
    const { toJSON } = renderWithTheme(<StreakCelebration {...defaultProps} streak={5} />);
    expect(toJSON()).toBeNull();
  });

  it('renders for 7-day milestone', async () => {
    const { findByText } = renderWithTheme(<StreakCelebration {...defaultProps} streak={7} />);
    expect(await findByText('AMAZING!')).toBeTruthy();
    expect(await findByText('One week streak!')).toBeTruthy();
    expect(await findByText('7')).toBeTruthy();
    expect(await findByText('day streak')).toBeTruthy();
  });

  it('renders for 30-day milestone', async () => {
    const { findByText } = renderWithTheme(<StreakCelebration {...defaultProps} streak={30} />);
    expect(await findByText('ON FIRE!')).toBeTruthy();
    expect(await findByText('30 days of consistency!')).toBeTruthy();
  });

  it('renders for 100-day milestone', async () => {
    const { findByText } = renderWithTheme(<StreakCelebration {...defaultProps} streak={100} />);
    expect(await findByText('INCREDIBLE!')).toBeTruthy();
    expect(await findByText('100 days strong!')).toBeTruthy();
  });

  it('renders for 365-day milestone', async () => {
    const { findByText } = renderWithTheme(<StreakCelebration {...defaultProps} streak={365} />);
    expect(await findByText('LEGENDARY!')).toBeTruthy();
    expect(await findByText('A full year of dedication!')).toBeTruthy();
  });

  it('displays habit name', async () => {
    const { findByText } = renderWithTheme(<StreakCelebration {...defaultProps} />);
    expect(await findByText('"Morning Meditation"')).toBeTruthy();
  });

  it('calls onClose when Keep Going button pressed', async () => {
    const onClose = jest.fn();
    const { findByText } = renderWithTheme(
      <StreakCelebration {...defaultProps} onClose={onClose} />,
    );
    fireEvent.press(await findByText('Keep Going!'));
    expect(onClose).toHaveBeenCalled();
  });

  it('returns null for non-milestone streaks like 8, 15, 50', () => {
    for (const nonMilestone of [8, 15, 50]) {
      const { toJSON } = renderWithTheme(
        <StreakCelebration {...defaultProps} streak={nonMilestone} />,
      );
      expect(toJSON()).toBeNull();
    }
  });
});
