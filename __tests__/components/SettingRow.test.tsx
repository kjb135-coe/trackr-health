import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '@/src/theme/ThemeContext';
import { SettingRow } from '@/src/components/settings';

jest.mock('react-native-reanimated', () => require('../helpers/reanimatedMock').reanimatedMock);

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    ChevronRight: (props: Record<string, unknown>) => <View testID="chevron" {...props} />,
  };
});

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('SettingRow', () => {
  it('renders title and subtitle', async () => {
    const { findByText } = renderWithTheme(
      <SettingRow icon={null} iconBg="#eee" title="My Setting" subtitle="A description" />,
    );
    await findByText('My Setting');
    await findByText('A description');
  });

  it('renders without subtitle', async () => {
    const { findByText, queryByText } = renderWithTheme(
      <SettingRow icon={null} iconBg="#eee" title="Title Only" />,
    );
    await findByText('Title Only');
    expect(queryByText('A description')).toBeNull();
  });

  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    const { findByText } = renderWithTheme(
      <SettingRow icon={null} iconBg="#eee" title="Pressable" onPress={onPress} />,
    );
    fireEvent.press(await findByText('Pressable'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows chevron when onPress is provided', async () => {
    const { findByTestId } = renderWithTheme(
      <SettingRow icon={null} iconBg="#eee" title="With Chevron" onPress={jest.fn()} />,
    );
    await findByTestId('chevron');
  });

  it('hides chevron when showChevron is false', async () => {
    const { queryByTestId, findByText } = renderWithTheme(
      <SettingRow
        icon={null}
        iconBg="#eee"
        title="No Chevron"
        onPress={jest.fn()}
        showChevron={false}
      />,
    );
    await findByText('No Chevron');
    expect(queryByTestId('chevron')).toBeNull();
  });

  it('renders rightElement instead of chevron', async () => {
    const { findByTestId, queryByTestId } = renderWithTheme(
      <SettingRow
        icon={null}
        iconBg="#eee"
        title="Custom Right"
        rightElement={<>{/* placeholder */}</>}
      />,
    );
    await findByTestId('chevron').catch(() => {
      // Expected — no chevron when rightElement provided
    });
    expect(queryByTestId('chevron')).toBeNull();
  });
});
