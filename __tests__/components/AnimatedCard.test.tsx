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

// Builder pattern mock for layout animations
const createLayoutAnimationMock = () => {
  const builder = {
    duration: () => builder,
    delay: () => builder,
    springify: () => builder,
    damping: () => builder,
    stiffness: () => builder,
  };
  return builder;
};

jest.mock('react-native-reanimated', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  const React = require('react'); // eslint-disable-line @typescript-eslint/no-require-imports

  // Strip reanimated-specific props before passing to RN components
  const stripAnimatedProps = (comp: React.ComponentType) =>
    // eslint-disable-next-line react/display-name
    React.forwardRef((props: Record<string, unknown>, ref: unknown) => {
      const { entering, exiting, ...rest } = props;
      return React.createElement(comp, { ...rest, ref });
    });

  return {
    __esModule: true,
    default: {
      createAnimatedComponent: stripAnimatedProps,
      View: stripAnimatedProps(View),
    },
    createAnimatedComponent: stripAnimatedProps,
    useSharedValue: (v: number) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    withSpring: (v: number) => v,
    withTiming: (v: number) => v,
    FadeInDown: createLayoutAnimationMock(),
    FadeOut: createLayoutAnimationMock(),
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

  it('renders with outlined variant', async () => {
    const { findByText } = renderWithTheme(
      <AnimatedCard variant="outlined" onPress={jest.fn()}>
        <Text>Outlined card</Text>
      </AnimatedCard>,
    );
    expect(await findByText('Outlined card')).toBeTruthy();
  });

  it('renders with filled variant', async () => {
    const { findByText } = renderWithTheme(
      <AnimatedCard variant="filled" onPress={jest.fn()}>
        <Text>Filled card</Text>
      </AnimatedCard>,
    );
    expect(await findByText('Filled card')).toBeTruthy();
  });

  it('handles pressIn and pressOut events', async () => {
    const onPress = jest.fn();
    const { findByText } = renderWithTheme(
      <AnimatedCard onPress={onPress}>
        <Text>Press events</Text>
      </AnimatedCard>,
    );
    const card = await findByText('Press events');
    fireEvent(card, 'onPressIn');
    fireEvent(card, 'onPressOut');
    fireEvent.press(card);
    expect(onPress).toHaveBeenCalled();
  });

  it('renders as non-pressable View when no onPress or onLongPress', async () => {
    const { findByText } = renderWithTheme(
      <AnimatedCard>
        <Text>Static card</Text>
      </AnimatedCard>,
    );
    expect(await findByText('Static card')).toBeTruthy();
  });
});
