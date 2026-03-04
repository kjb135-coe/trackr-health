import React from 'react';
import { render } from '@testing-library/react-native';
import NotFoundScreen from '@/app/+not-found';

jest.mock('react-native-reanimated', () => require('../helpers/reanimatedMock').reanimatedMock);

jest.mock('@/src/theme/ThemeContext', () => {
  const actual = jest.requireActual('@/src/theme/ThemeContext');
  return {
    ...actual,
    useTheme: () => ({
      colors: actual.lightColors,
      isDark: false,
      mode: 'light',
      setMode: jest.fn(),
    }),
  };
});

jest.mock('expo-router', () => ({
  Link: ({ children, ...props }: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { View } = require('react-native');
    return <View {...props}>{children as React.ReactNode}</View>;
  },
  Stack: {
    Screen: (_props: Record<string, unknown>) => null,
  },
}));

describe('NotFoundScreen', () => {
  it('renders the not found message', () => {
    const { getByText } = render(<NotFoundScreen />);
    expect(getByText("This screen doesn't exist.")).toBeTruthy();
  });

  it('renders a link to the home screen', () => {
    const { getByText } = render(<NotFoundScreen />);
    expect(getByText('Go to home screen!')).toBeTruthy();
  });
});
