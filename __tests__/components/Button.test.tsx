import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@/src/theme/ThemeContext';
import { Button } from '@/src/components/ui/Button';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('Button', () => {
  it('renders the title text', async () => {
    const { findByText } = renderWithTheme(<Button title="Press me" onPress={() => {}} />);
    expect(await findByText('Press me')).toBeTruthy();
  });

  it('calls onPress when tapped', async () => {
    const onPress = jest.fn();
    const { findByText } = renderWithTheme(<Button title="Tap" onPress={onPress} />);
    const button = await findByText('Tap');
    fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', async () => {
    const onPress = jest.fn();
    const { findByText } = renderWithTheme(<Button title="Disabled" onPress={onPress} disabled />);
    const button = await findByText('Disabled');
    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows loading indicator when loading', async () => {
    const { queryByText } = renderWithTheme(<Button title="Loading" onPress={() => {}} loading />);
    await waitFor(() => {
      expect(queryByText('Loading')).toBeNull();
    });
  });
});
