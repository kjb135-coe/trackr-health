import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '@/src/theme/ThemeContext';
import { QuickActions } from '@/src/components/dashboard/QuickActions';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium' },
}));

jest.mock('react-native-reanimated', () => require('../helpers/reanimatedMock').reanimatedMock);

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('QuickActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all 4 action labels', async () => {
    const { findByText } = renderWithTheme(<QuickActions />);
    expect(await findByText('Log Sleep')).toBeTruthy();
    expect(await findByText('Workout')).toBeTruthy();
    expect(await findByText('Scan Food')).toBeTruthy();
    expect(await findByText('Journal')).toBeTruthy();
  });

  it('renders section title', async () => {
    const { findByText } = renderWithTheme(<QuickActions />);
    expect(await findByText('Quick Actions')).toBeTruthy();
  });

  it('navigates to sleep log on press', async () => {
    const { findByText } = renderWithTheme(<QuickActions />);
    fireEvent.press(await findByText('Log Sleep'));
    expect(mockPush).toHaveBeenCalledWith('/sleep/log');
  });

  it('navigates to exercise log on press', async () => {
    const { findByText } = renderWithTheme(<QuickActions />);
    fireEvent.press(await findByText('Workout'));
    expect(mockPush).toHaveBeenCalledWith('/exercise/log');
  });

  it('navigates to nutrition camera on press', async () => {
    const { findByText } = renderWithTheme(<QuickActions />);
    fireEvent.press(await findByText('Scan Food'));
    expect(mockPush).toHaveBeenCalledWith('/nutrition/camera');
  });

  it('navigates to journal new on press', async () => {
    const { findByText } = renderWithTheme(<QuickActions />);
    fireEvent.press(await findByText('Journal'));
    expect(mockPush).toHaveBeenCalledWith('/journal/new');
  });
});
