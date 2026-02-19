import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ThemeProvider } from '@/src/theme/ThemeContext';
import SettingsScreen from '@/app/settings';

jest.mock('react-native-reanimated', () => require('../helpers/reanimatedMock').reanimatedMock);

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

jest.mock('expo-constants', () => ({
  expoConfig: { version: '1.6.0' },
}));

const mockHasApiKey = jest.fn();
const mockSetApiKey = jest.fn();
const mockDeleteApiKey = jest.fn();
jest.mock('@/src/services/claude', () => ({
  hasApiKey: () => mockHasApiKey(),
  setApiKey: (...args: unknown[]) => mockSetApiKey(...args),
  deleteApiKey: () => mockDeleteApiKey(),
}));

const mockShareExportedData = jest.fn();
const mockShareCSVExport = jest.fn();
jest.mock('@/src/services/export', () => ({
  shareExportedData: () => mockShareExportedData(),
  shareCSVExport: (...args: unknown[]) => mockShareCSVExport(...args),
}));

jest.mock('@/src/services/notifications', () => ({
  requestNotificationPermissions: jest.fn(() => Promise.resolve(true)),
}));

const mockGetDatabase = jest.fn();
jest.mock('@/src/database', () => ({
  getDatabase: () => mockGetDatabase(),
}));

const mockSignOut = jest.fn();
jest.mock('@/src/store', () => ({
  useAuthStore: () => ({
    user: { displayName: 'Test User', email: 'test@example.com' },
    signOut: mockSignOut,
  }),
}));

jest.spyOn(Alert, 'alert');

function renderWithTheme() {
  return render(
    <ThemeProvider>
      <SettingsScreen />
    </ThemeProvider>,
  );
}

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHasApiKey.mockResolvedValue(false);
  });

  it('renders section titles', async () => {
    const { findByText } = renderWithTheme();
    await findByText('Account');
    await findByText('AI Features');
    await findByText('Appearance');
    await findByText('Preferences');
    await findByText('Data');
    await findByText('Support');
  });

  it('shows user display name and email', async () => {
    const { findByText } = renderWithTheme();
    await findByText('Test User');
    await findByText('test@example.com');
  });

  it('shows app version', async () => {
    const { findByText } = renderWithTheme();
    await findByText('Trackr v1.6.0');
  });

  it('shows API key not configured', async () => {
    const { findByText } = renderWithTheme();
    await findByText('Required for AI features');
  });

  it('shows API key configured when key exists', async () => {
    mockHasApiKey.mockResolvedValue(true);
    const { findByText } = renderWithTheme();
    await findByText('API key configured');
  });

  it('shows API key input when Claude API Key row is pressed', async () => {
    const { findByText, findByPlaceholderText } = renderWithTheme();
    fireEvent.press(await findByText('Claude API Key'));
    await findByPlaceholderText('sk-ant-api...');
  });

  it('shows alert for empty API key', async () => {
    const { findByText } = renderWithTheme();
    fireEvent.press(await findByText('Claude API Key'));
    fireEvent.press(await findByText('Save'));

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter an API key');
  });

  it('saves API key and shows success', async () => {
    mockSetApiKey.mockResolvedValue(undefined);
    const { findByText, findByPlaceholderText } = renderWithTheme();

    fireEvent.press(await findByText('Claude API Key'));
    const input = await findByPlaceholderText('sk-ant-api...');
    fireEvent.changeText(input, 'sk-ant-test123');
    fireEvent.press(await findByText('Save'));

    await waitFor(() => {
      expect(mockSetApiKey).toHaveBeenCalledWith('sk-ant-test123');
    });
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'API key saved successfully');
    });
  });

  it('shows sign out confirmation and calls signOut', async () => {
    mockSignOut.mockResolvedValue(undefined);
    const { findByText } = renderWithTheme();

    fireEvent.press(await findByText('Sign Out'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Sign Out',
      'Are you sure you want to sign out?',
      expect.any(Array),
    );

    // Simulate pressing "Sign Out" in the alert
    const alertCall = (Alert.alert as jest.Mock).mock.calls.find((call) => call[0] === 'Sign Out');
    const signOutButton = alertCall[2].find((btn: { text: string }) => btn.text === 'Sign Out');
    await signOutButton.onPress();

    expect(mockSignOut).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/auth/login');
  });

  it('navigates to goals when My Goals is pressed', async () => {
    const { findByText } = renderWithTheme();
    fireEvent.press(await findByText('My Goals'));
    expect(mockPush).toHaveBeenCalledWith('/goals');
  });

  it('calls shareExportedData when Export All Data is pressed', async () => {
    mockShareExportedData.mockResolvedValue(undefined);
    const { findByText } = renderWithTheme();

    fireEvent.press(await findByText('Export All Data'));

    await waitFor(() => {
      expect(mockShareExportedData).toHaveBeenCalled();
    });
  });

  it('shows export failed alert when export throws', async () => {
    mockShareExportedData.mockRejectedValue(new Error('Export error'));
    const { findByText } = renderWithTheme();

    fireEvent.press(await findByText('Export All Data'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Export Failed', 'Export error');
    });
  });

  it('shows CSV export type selector', async () => {
    const { findByText } = renderWithTheme();
    fireEvent.press(await findByText('Export as CSV'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Export CSV',
      'Choose which data to export',
      expect.any(Array),
    );
  });

  it('shows clear data confirmation', async () => {
    const { findByText } = renderWithTheme();
    fireEvent.press(await findByText('Clear All Data'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Clear All Data',
      expect.stringContaining('permanently delete'),
      expect.any(Array),
    );
  });

  it('clears all data when confirmed', async () => {
    const mockExecAsync = jest.fn();
    mockGetDatabase.mockResolvedValue({ execAsync: mockExecAsync });

    const { findByText } = renderWithTheme();
    fireEvent.press(await findByText('Clear All Data'));

    const alertCall = (Alert.alert as jest.Mock).mock.calls.find(
      (call) => call[0] === 'Clear All Data',
    );
    const deleteButton = alertCall[2].find(
      (btn: { text: string }) => btn.text === 'Delete Everything',
    );
    await deleteButton.onPress();

    expect(mockExecAsync).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith('Done', 'All data has been cleared.');
  });

  it('renders theme picker with Light, Dark, Auto options', async () => {
    const { findByText } = renderWithTheme();
    await findByText('Light');
    await findByText('Dark');
    await findByText('Auto');
  });

  it('shows privacy policy when pressed', async () => {
    const { findByText } = renderWithTheme();
    fireEvent.press(await findByText('Privacy Policy'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Privacy Policy',
      expect.stringContaining('stored locally'),
    );
  });
});
