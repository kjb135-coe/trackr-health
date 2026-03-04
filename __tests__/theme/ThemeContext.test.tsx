import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, useTheme } from '@/src/theme/ThemeContext';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => 'light',
}));

function TestConsumer() {
  const { colors, mode, isDark, setMode } = useTheme();
  return (
    <>
      <Text testID="mode">{mode}</Text>
      <Text testID="isDark">{String(isDark)}</Text>
      <Text testID="bgColor">{colors.background}</Text>
      <Text onPress={() => setMode('dark')} testID="setDark">
        Set Dark
      </Text>
      <Text onPress={() => setMode('light')} testID="setLight">
        Set Light
      </Text>
      <Text onPress={() => setMode('system')} testID="setSystem">
        Set System
      </Text>
    </>
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  it('defaults to system mode', async () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    );
    await waitFor(
      () => {
        expect(getByTestId('mode').props.children).toBe('system');
      },
      { timeout: 5000 },
    );
  });

  it('defaults to light when system scheme is light', async () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    );
    await waitFor(
      () => {
        expect(getByTestId('isDark').props.children).toBe('false');
      },
      { timeout: 5000 },
    );
  });

  it('loads saved theme mode from AsyncStorage', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('dark');
    const { getByTestId } = render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    );
    await waitFor(
      () => {
        expect(getByTestId('mode').props.children).toBe('dark');
        expect(getByTestId('isDark').props.children).toBe('true');
      },
      { timeout: 5000 },
    );
  });

  it('switches to dark mode when setMode called', async () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    );
    await waitFor(
      () => {
        expect(getByTestId('mode').props.children).toBe('system');
      },
      { timeout: 5000 },
    );
    fireEvent.press(getByTestId('setDark'));
    await waitFor(
      () => {
        expect(getByTestId('mode').props.children).toBe('dark');
        expect(getByTestId('isDark').props.children).toBe('true');
      },
      { timeout: 5000 },
    );
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@trackr_theme_mode', 'dark');
  });

  it('switches to light mode when setMode called', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('dark');
    const { getByTestId } = render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    );
    await waitFor(
      () => {
        expect(getByTestId('isDark').props.children).toBe('true');
      },
      { timeout: 5000 },
    );
    fireEvent.press(getByTestId('setLight'));
    await waitFor(
      () => {
        expect(getByTestId('mode').props.children).toBe('light');
        expect(getByTestId('isDark').props.children).toBe('false');
      },
      { timeout: 5000 },
    );
  });

  it('ignores invalid saved theme mode', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid');
    const { getByTestId } = render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    );
    await waitFor(
      () => {
        expect(getByTestId('mode').props.children).toBe('system');
      },
      { timeout: 5000 },
    );
  });

  it('handles AsyncStorage read error gracefully', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('storage error'));
    const { getByTestId } = render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    );
    await waitFor(
      () => {
        expect(getByTestId('mode').props.children).toBe('system');
      },
      { timeout: 5000 },
    );
  });

  it('throws when useTheme used outside ThemeProvider', () => {
    expect(() => render(<TestConsumer />)).toThrow('useTheme must be used within a ThemeProvider');
  });
});
