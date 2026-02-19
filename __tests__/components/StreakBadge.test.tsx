import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@/src/theme/ThemeContext';
import { StreakBadge } from '@/src/components/habits/StreakBadge';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('StreakBadge', () => {
  it('returns null when streak is 0', async () => {
    const { toJSON } = renderWithTheme(<StreakBadge streak={0} />);
    expect(toJSON()).toBeNull();
  });

  it('renders streak number for small streaks', async () => {
    const { findByText } = renderWithTheme(<StreakBadge streak={3} />);
    expect(await findByText('3')).toBeTruthy();
  });

  it('renders streak number for 7-day milestone', async () => {
    const { findByText } = renderWithTheme(<StreakBadge streak={7} />);
    expect(await findByText('7')).toBeTruthy();
  });

  it('shows label for large size at 30+ days', async () => {
    const { findByText } = renderWithTheme(<StreakBadge streak={30} size="lg" />);
    expect(await findByText('30')).toBeTruthy();
    expect(await findByText('On Fire')).toBeTruthy();
  });

  it('shows Champion label for 100+ days at large size', async () => {
    const { findByText } = renderWithTheme(<StreakBadge streak={100} size="lg" />);
    expect(await findByText('100')).toBeTruthy();
    expect(await findByText('Champion')).toBeTruthy();
  });

  it('shows Legendary label for 365+ days at large size', async () => {
    const { findByText } = renderWithTheme(<StreakBadge streak={365} size="lg" />);
    expect(await findByText('365')).toBeTruthy();
    expect(await findByText('Legendary')).toBeTruthy();
  });

  it('does not show label at medium size', async () => {
    const { findByText, queryByText } = renderWithTheme(<StreakBadge streak={30} size="md" />);
    expect(await findByText('30')).toBeTruthy();
    expect(queryByText('On Fire')).toBeNull();
  });
});
