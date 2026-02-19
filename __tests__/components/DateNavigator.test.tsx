import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '@/src/theme/ThemeContext';
import { DateNavigator } from '@/src/components/ui';
import { getDateString } from '@/src/utils/date';
import { format, subDays } from 'date-fns';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('DateNavigator', () => {
  it('renders "Today" label for current date', async () => {
    const today = getDateString();
    const { findByText } = renderWithTheme(<DateNavigator date={today} onDateChange={() => {}} />);
    expect(await findByText('Today')).toBeTruthy();
  });

  it('renders "Yesterday" for previous day', async () => {
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    const { findByText } = renderWithTheme(
      <DateNavigator date={yesterday} onDateChange={() => {}} />,
    );
    expect(await findByText('Yesterday')).toBeTruthy();
  });

  it('calls onDateChange when date label pressed on past date', async () => {
    const twoDaysAgo = format(subDays(new Date(), 2), 'yyyy-MM-dd');
    const onDateChange = jest.fn();
    const { findByText } = renderWithTheme(
      <DateNavigator date={twoDaysAgo} onDateChange={onDateChange} />,
    );

    // Press the date label to navigate to today
    const label = await findByText(/\w+/);
    fireEvent.press(label);

    const today = getDateString();
    expect(onDateChange).toHaveBeenCalledWith(today);
  });

  it('does not navigate forward when on today', async () => {
    const today = getDateString();
    const onDateChange = jest.fn();
    const { findByText } = renderWithTheme(
      <DateNavigator date={today} onDateChange={onDateChange} />,
    );

    // Tapping "Today" label does nothing since we're already on today
    const label = await findByText('Today');
    fireEvent.press(label);

    expect(onDateChange).not.toHaveBeenCalled();
  });
});
