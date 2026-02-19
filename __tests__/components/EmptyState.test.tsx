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
    await findByText('No items yet');
    await findByText('Tap + to add one');
  });

  it('renders icon when provided', async () => {
    const { findByText } = renderWithTheme(
      <EmptyState icon={<Text>icon-element</Text>} title="Empty" subtitle="Nothing here" />,
    );
    await findByText('icon-element');
    await findByText('Empty');
  });

  it('renders without icon when not provided', async () => {
    const { findByText } = renderWithTheme(
      <EmptyState title="No data" subtitle="Come back later" />,
    );
    await findByText('No data');
    await findByText('Come back later');
  });
});
