import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ThemeProvider } from '@/src/theme/ThemeContext';
import { AnimatedButton } from '@/src/components/ui';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium' },
}));

jest.mock('react-native-reanimated', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  const createAnimatedComponent = (comp: unknown) => comp;
  return {
    __esModule: true,
    default: { createAnimatedComponent, View },
    createAnimatedComponent,
    useSharedValue: () => ({ value: 1 }),
    useAnimatedStyle: () => ({}),
    withSpring: (v: number) => v,
    withSequence: (...args: number[]) => args[0],
  };
});

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('AnimatedButton', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders title text', async () => {
    const { findByText } = renderWithTheme(<AnimatedButton title="Save" onPress={jest.fn()} />);
    expect(await findByText('Save')).toBeTruthy();
  });

  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    const { findByText } = renderWithTheme(<AnimatedButton title="Submit" onPress={onPress} />);
    fireEvent.press(await findByText('Submit'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('hides title when loading', async () => {
    const { queryByText } = renderWithTheme(
      <AnimatedButton title="Save" onPress={jest.fn()} loading />,
    );
    // Title should not be visible when loading
    expect(queryByText('Save')).toBeNull();
  });

  it('does not call onPress when disabled', async () => {
    const onPress = jest.fn();
    const { findByText } = renderWithTheme(
      <AnimatedButton title="Save" onPress={onPress} disabled />,
    );
    fireEvent.press(await findByText('Save'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders icon when provided', async () => {
    const { findByText } = renderWithTheme(
      <AnimatedButton title="Add" onPress={jest.fn()} icon={<Text>+</Text>} />,
    );
    expect(await findByText('+')).toBeTruthy();
    expect(await findByText('Add')).toBeTruthy();
  });

  it('triggers haptic feedback by default', async () => {
    const Haptics = require('expo-haptics');
    const { findByText } = renderWithTheme(<AnimatedButton title="Tap" onPress={jest.fn()} />);
    fireEvent.press(await findByText('Tap'));
    expect(Haptics.impactAsync).toHaveBeenCalled();
  });

  it('skips haptic feedback when haptic=false', async () => {
    const Haptics = require('expo-haptics');
    const { findByText } = renderWithTheme(
      <AnimatedButton title="Tap" onPress={jest.fn()} haptic={false} />,
    );
    fireEvent.press(await findByText('Tap'));
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });
});
