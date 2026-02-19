import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@/src/theme/ThemeContext';
import { Skeleton, SkeletonCard } from '@/src/components/ui';

jest.mock('react-native-reanimated', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  const React = require('react'); // eslint-disable-line @typescript-eslint/no-require-imports
  const stripAnimatedProps = (comp: React.ComponentType) =>
    // eslint-disable-next-line react/display-name
    React.forwardRef((props: Record<string, unknown>, ref: unknown) => {
      const { entering, exiting, ...rest } = props;
      return React.createElement(comp, { ...rest, ref });
    });
  return {
    __esModule: true,
    default: { View: stripAnimatedProps(View), createAnimatedComponent: stripAnimatedProps },
    createAnimatedComponent: stripAnimatedProps,
    useSharedValue: (v: number) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    withRepeat: (v: number) => v,
    withTiming: (v: number) => v,
    withSpring: (v: number) => v,
    withSequence: (...args: number[]) => args[0],
    interpolate: () => 0,
    Easing: { inOut: () => ({}), ease: {} },
  };
});

jest.mock('expo-linear-gradient', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  return { LinearGradient: View };
});

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('Skeleton', () => {
  it('renders with given dimensions', async () => {
    const { toJSON } = renderWithTheme(<Skeleton width={100} height={20} />);
    await waitFor(() => {
      expect(toJSON()).toBeTruthy();
    });
  });

  it('renders with percentage width', async () => {
    const { toJSON } = renderWithTheme(<Skeleton width="80%" height={16} />);
    await waitFor(() => {
      expect(toJSON()).toBeTruthy();
    });
  });
});

describe('SkeletonCard', () => {
  it('renders with default 3 lines', async () => {
    const tree = renderWithTheme(<SkeletonCard />);
    await waitFor(() => {
      expect(tree.toJSON()).toBeTruthy();
    });
  });

  it('renders with custom line count', async () => {
    const tree = renderWithTheme(<SkeletonCard lines={5} />);
    await waitFor(() => {
      expect(tree.toJSON()).toBeTruthy();
    });
  });
});
