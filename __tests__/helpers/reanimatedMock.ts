/**
 * Shared react-native-reanimated mock for tests.
 *
 * Usage in test files:
 *   jest.mock('react-native-reanimated', () => require('../helpers/reanimatedMock').reanimatedMock);
 *
 * Or with extra overrides:
 *   jest.mock('react-native-reanimated', () => ({
 *     ...require('../helpers/reanimatedMock').reanimatedMock,
 *     interpolate: () => 0,
 *   }));
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { View } = require('react-native');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const React = require('react');

/** Strips reanimated-specific props (entering/exiting) before passing to RN components */
const stripAnimatedProps = (comp: React.ComponentType) =>
  // eslint-disable-next-line react/display-name
  React.forwardRef((props: Record<string, unknown>, ref: unknown) => {
    const { entering, exiting, ...rest } = props;
    return React.createElement(comp, { ...rest, ref });
  });

/** Chainable builder that mimics layout animation API (FadeInDown.duration().delay().springify()) */
const layoutAnimationMock = () => {
  const b: Record<string, unknown> = {};
  b.duration = () => b;
  b.delay = () => b;
  b.springify = () => b;
  b.damping = () => b;
  b.stiffness = () => b;
  return b;
};

export const reanimatedMock = {
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
  withSequence: (...args: number[]) => args[0],
  withRepeat: (v: number) => v,
  FadeInDown: layoutAnimationMock(),
  FadeIn: layoutAnimationMock(),
  FadeOut: layoutAnimationMock(),
  interpolate: () => 0,
  Easing: { inOut: () => ({}), ease: {} },
};
