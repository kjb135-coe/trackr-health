import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '@/src/theme/ThemeContext';
import { ErrorBanner } from '@/src/components/ui';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('ErrorBanner', () => {
  it('renders the error message', async () => {
    const { findByText } = renderWithTheme(
      <ErrorBanner error="Something went wrong" onDismiss={() => {}} />,
    );
    expect(await findByText('Something went wrong')).toBeTruthy();
  });

  it('calls onDismiss when pressed', async () => {
    const onDismiss = jest.fn();
    const { findByText } = renderWithTheme(
      <ErrorBanner error="Network error" onDismiss={onDismiss} />,
    );

    const banner = await findByText('Network error');
    fireEvent.press(banner);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
