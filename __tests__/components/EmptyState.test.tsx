import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ThemeProvider } from '@/src/theme/ThemeContext';
import { EmptyState } from '@/src/components/ui';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('EmptyState', () => {
  it('renders title and subtitle', async () => {
    const { findByText } = renderWithTheme(
      <EmptyState title="No items yet" subtitle="Tap + to add one" />,
    );
    expect(await findByText('No items yet')).toBeTruthy();
    expect(await findByText('Tap + to add one')).toBeTruthy();
  });

  it('renders icon when provided', async () => {
    const { findByText } = renderWithTheme(
      <EmptyState icon={<Text>icon-element</Text>} title="Empty" subtitle="Nothing here" />,
    );
    expect(await findByText('icon-element')).toBeTruthy();
    expect(await findByText('Empty')).toBeTruthy();
  });

  it('renders without icon when not provided', async () => {
    const { findByText, queryByText } = renderWithTheme(
      <EmptyState title="No data" subtitle="Come back later" />,
    );
    expect(await findByText('No data')).toBeTruthy();
    expect(await findByText('Come back later')).toBeTruthy();
  });
});
