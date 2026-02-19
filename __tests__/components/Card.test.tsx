import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ThemeProvider } from '@/src/theme/ThemeContext';
import { Card } from '@/src/components/ui/Card';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('Card', () => {
  it('renders children', async () => {
    const { findByText } = renderWithTheme(
      <Card>
        <Text>Card content</Text>
      </Card>,
    );
    await findByText('Card content');
  });

  it('renders as TouchableOpacity when onPress is provided', async () => {
    const onPress = jest.fn();
    const { findByText } = renderWithTheme(
      <Card onPress={onPress}>
        <Text>Tappable card</Text>
      </Card>,
    );

    const card = await findByText('Tappable card');
    fireEvent.press(card);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders as View when onPress is not provided', async () => {
    const { findByText } = renderWithTheme(
      <Card>
        <Text>Static card</Text>
      </Card>,
    );
    await findByText('Static card');
  });
});
