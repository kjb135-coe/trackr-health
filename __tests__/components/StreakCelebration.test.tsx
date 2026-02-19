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
    await findByText('AMAZING!');
    await findByText('One week streak!');
    await findByText('7');
    await findByText('day streak');
  });

  it('renders for 30-day milestone', async () => {
    const { findByText } = renderWithTheme(<StreakCelebration {...defaultProps} streak={30} />);
    await findByText('ON FIRE!');
    await findByText('30 days of consistency!');
  });

  it('renders for 100-day milestone', async () => {
    const { findByText } = renderWithTheme(<StreakCelebration {...defaultProps} streak={100} />);
    await findByText('INCREDIBLE!');
    await findByText('100 days strong!');
  });

  it('renders for 365-day milestone', async () => {
    const { findByText } = renderWithTheme(<StreakCelebration {...defaultProps} streak={365} />);
    await findByText('LEGENDARY!');
    await findByText('A full year of dedication!');
  });

  it('displays habit name', async () => {
    const { findByText } = renderWithTheme(<StreakCelebration {...defaultProps} />);
    await findByText('"Morning Meditation"');
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
