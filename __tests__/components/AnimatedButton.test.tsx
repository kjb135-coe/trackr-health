import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ThemeProvider } from '@/src/theme/ThemeContext';
import { AnimatedButton } from '@/src/components/ui';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium' },
}));

jest.mock('react-native-reanimated', () => require('../helpers/reanimatedMock').reanimatedMock);

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('AnimatedButton', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders title text', async () => {
    const { findByText } = renderWithTheme(<AnimatedButton title="Save" onPress={jest.fn()} />);
    await findByText('Save');
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
    await findByText('+');
    await findByText('Add');
  });

  it('triggers haptic feedback by default', async () => {
    const { findByText } = renderWithTheme(<AnimatedButton title="Tap" onPress={jest.fn()} />);
    fireEvent.press(await findByText('Tap'));
    expect(Haptics.impactAsync).toHaveBeenCalled();
  });

  it('skips haptic feedback when haptic=false', async () => {
    const { findByText } = renderWithTheme(
      <AnimatedButton title="Tap" onPress={jest.fn()} haptic={false} />,
    );
    fireEvent.press(await findByText('Tap'));
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it('renders ghost variant', async () => {
    const { findByText } = renderWithTheme(
      <AnimatedButton title="Ghost" onPress={jest.fn()} variant="ghost" />,
    );
    await findByText('Ghost');
  });

  it('renders danger variant', async () => {
    const { findByText } = renderWithTheme(
      <AnimatedButton title="Delete" onPress={jest.fn()} variant="danger" />,
    );
    await findByText('Delete');
  });

  it('handles pressIn and pressOut events', async () => {
    const onPress = jest.fn();
    const { findByText } = renderWithTheme(<AnimatedButton title="PressMe" onPress={onPress} />);
    const button = await findByText('PressMe');
    fireEvent(button, 'onPressIn');
    fireEvent(button, 'onPressOut');
    fireEvent.press(button);
    expect(onPress).toHaveBeenCalled();
  });

  it('renders secondary variant', async () => {
    const { findByText } = renderWithTheme(
      <AnimatedButton title="Secondary" onPress={jest.fn()} variant="secondary" />,
    );
    await findByText('Secondary');
  });

  it('renders with sm size', async () => {
    const { findByText } = renderWithTheme(
      <AnimatedButton title="Small" onPress={jest.fn()} size="sm" />,
    );
    await findByText('Small');
  });

  it('renders with lg size', async () => {
    const { findByText } = renderWithTheme(
      <AnimatedButton title="Large" onPress={jest.fn()} size="lg" />,
    );
    await findByText('Large');
  });
});
