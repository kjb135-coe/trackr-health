import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '@/src/theme/ThemeContext';
import { ThemePicker } from '@/src/components/settings';

jest.mock('react-native-reanimated', () => require('../helpers/reanimatedMock').reanimatedMock);

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  const icon =
    (name: string) =>
    // eslint-disable-next-line react/display-name
    (props: Record<string, unknown>) => <View testID={`icon-${name}`} {...props} />;
  return {
    __esModule: true,
    Sun: icon('sun'),
    Moon: icon('moon'),
    Smartphone: icon('smartphone'),
  };
});

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('ThemePicker', () => {
  it('renders Light, Dark, and Auto options', async () => {
    const { findByText } = renderWithTheme(<ThemePicker />);
    await findByText('Light');
    await findByText('Dark');
    await findByText('Auto');
  });

  it('renders all three icons', async () => {
    const { findByTestId } = renderWithTheme(<ThemePicker />);
    await findByTestId('icon-sun');
    await findByTestId('icon-moon');
    await findByTestId('icon-smartphone');
  });

  it('can press Dark option', async () => {
    const { findByText } = renderWithTheme(<ThemePicker />);
    const darkButton = await findByText('Dark');
    fireEvent.press(darkButton);
    // No error = success. The theme change is handled internally by ThemeContext.
  });
});
