import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@/src/theme/ThemeContext';
import { WeeklyInsights } from '@/src/components/dashboard/WeeklyInsights';

jest.mock('react-native-reanimated', () => require('../helpers/reanimatedMock').reanimatedMock);

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('WeeklyInsights', () => {
  const baseInsights = [
    {
      label: 'Habits',
      current: 80,
      previous: 70,
      unit: '%',
      color: '#4CAF50',
      higherIsBetter: true,
    },
    {
      label: 'Sleep',
      current: 7.5,
      previous: 7.0,
      unit: 'h',
      color: '#7C4DFF',
      higherIsBetter: true,
    },
    {
      label: 'Exercise',
      current: 150,
      previous: 200,
      unit: 'min',
      color: '#FF5722',
      higherIsBetter: true,
    },
  ];

  it('renders title and subtitle', async () => {
    const { findByText } = renderWithTheme(<WeeklyInsights insights={baseInsights} />);
    expect(await findByText('Weekly Progress')).toBeTruthy();
    expect(await findByText('Compared to last week')).toBeTruthy();
  });

  it('renders all insight labels', async () => {
    const { findByText } = renderWithTheme(<WeeklyInsights insights={baseInsights} />);
    expect(await findByText('Habits')).toBeTruthy();
    expect(await findByText('Sleep')).toBeTruthy();
    expect(await findByText('Exercise')).toBeTruthy();
  });

  it('renders current values with units', async () => {
    const { findByText } = renderWithTheme(<WeeklyInsights insights={baseInsights} />);
    expect(await findByText(/80%/)).toBeTruthy();
    expect(await findByText(/7\.5h/)).toBeTruthy();
    expect(await findByText(/150min/)).toBeTruthy();
  });

  it('shows positive trend for improvement (higherIsBetter)', async () => {
    const insights = [
      {
        label: 'Habits',
        current: 100,
        previous: 50,
        unit: '%',
        color: '#4CAF50',
        higherIsBetter: true,
      },
    ];
    const { findByText } = renderWithTheme(<WeeklyInsights insights={insights} />);
    // +100% change
    expect(await findByText('+100%')).toBeTruthy();
  });

  it('shows negative trend for decline (higherIsBetter)', async () => {
    const insights = [
      {
        label: 'Exercise',
        current: 50,
        previous: 100,
        unit: 'min',
        color: '#FF5722',
        higherIsBetter: true,
      },
    ];
    const { findByText } = renderWithTheme(<WeeklyInsights insights={insights} />);
    // -50% change
    expect(await findByText('-50%')).toBeTruthy();
  });

  it('shows neutral trend for small changes (<5%)', async () => {
    const insights = [
      {
        label: 'Sleep',
        current: 7.0,
        previous: 7.1,
        unit: 'h',
        color: '#7C4DFF',
        higherIsBetter: true,
      },
    ];
    const { findByText } = renderWithTheme(<WeeklyInsights insights={insights} />);
    // -1.4% rounds to -1%, which is < 5% so neutral
    expect(await findByText(/-1%/)).toBeTruthy();
  });

  it('handles zero previous value gracefully', async () => {
    const insights = [
      {
        label: 'New',
        current: 50,
        previous: 0,
        unit: 'min',
        color: '#FF5722',
        higherIsBetter: true,
      },
    ];
    const { findByText } = renderWithTheme(<WeeklyInsights insights={insights} />);
    // previous=0 → neutral with 0%
    expect(await findByText('0%')).toBeTruthy();
  });
});
