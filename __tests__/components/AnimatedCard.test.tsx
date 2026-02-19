import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ThemeProvider } from '@/src/theme/ThemeContext';
import { AnimatedCard } from '@/src/components/ui';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

jest.mock('react-native-reanimated', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  const createAnimatedComponent = (comp: unknown) => comp;
  return {
    __esModule: true,
    default: { createAnimatedComponent, View },
    createAnimatedComponent,
    useSharedValue: () => ({ value: 0 }),
    useAnimatedStyle: () => ({}),
    withSpring: (v: number) => v,
    withTiming: (v: number) => v,
  };
});

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('AnimatedCard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders children', async () => {
    const { findByText } = renderWithTheme(
      <AnimatedCard>
        <Text>Card content</Text>
      </AnimatedCard>,
    );
    expect(await findByText('Card content')).toBeTruthy();
  });

  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    const { findByText } = renderWithTheme(
      <AnimatedCard onPress={onPress}>
        <Text>Pressable card</Text>
      </AnimatedCard>,
    );
    fireEvent.press(await findByText('Pressable card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('calls onLongPress when long pressed', async () => {
    const onLongPress = jest.fn();
    const { findByText } = renderWithTheme(
      <AnimatedCard onLongPress={onLongPress}>
        <Text>Long press me</Text>
      </AnimatedCard>,
    );
    fireEvent(await findByText('Long press me'), 'onLongPress');
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it('triggers haptic feedback on press by default', async () => {
    const { findByText } = renderWithTheme(
      <AnimatedCard onPress={jest.fn()}>
        <Text>Haptic card</Text>
      </AnimatedCard>,
    );
    fireEvent.press(await findByText('Haptic card'));
    expect(Haptics.impactAsync).toHaveBeenCalled();
  });

  it('skips haptic feedback when haptic=false', async () => {
    const { findByText } = renderWithTheme(
      <AnimatedCard onPress={jest.fn()} haptic={false}>
        <Text>No haptic</Text>
      </AnimatedCard>,
    );
    fireEvent.press(await findByText('No haptic'));
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it('renders as non-pressable View when no onPress or onLongPress', async () => {
    const { findByText } = renderWithTheme(
      <AnimatedCard>
        <Text>Static card</Text>
      </AnimatedCard>,
    );
    // Should render without error and show content
    expect(await findByText('Static card')).toBeTruthy();
  });
});
