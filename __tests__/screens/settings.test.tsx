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

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  const icon =
    (name: string) =>
    // eslint-disable-next-line react/display-name
    (props: Record<string, unknown>) => <View testID={`icon-${name}`} {...props} />;
  return {
    __esModule: true,
    User: icon('user'),
    Key: icon('key'),
    Bell: icon('bell'),
    Moon: icon('moon'),
    Sun: icon('sun'),
    Smartphone: icon('smartphone'),
    LogOut: icon('logout'),
    ChevronRight: icon('chevron-right'),
    Shield: icon('shield'),
    Trash2: icon('trash2'),
    Star: icon('star'),
    Share2: icon('share2'),
    Mail: icon('mail'),
    Target: icon('target'),
    Download: icon('download'),
  };
});

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

const mockCancelAllHabitReminders = jest.fn().mockResolvedValue(undefined);
const mockScheduleHabitReminder = jest.fn().mockResolvedValue('notif-id');
jest.mock('@/src/services/notifications', () => ({
  requestNotificationPermissions: jest.fn(() => Promise.resolve(true)),
  cancelAllHabitReminders: (...args: unknown[]) => mockCancelAllHabitReminders(...args),
  scheduleHabitReminder: (...args: unknown[]) => mockScheduleHabitReminder(...args),
}));

const mockGetDatabase = jest.fn();
jest.mock('@/src/database', () => ({
  getDatabase: () => mockGetDatabase(),
}));

const mockGetAllHabits = jest.fn().mockResolvedValue([]);
jest.mock('@/src/database/repositories', () => ({
  habitRepository: {
    getAll: () => mockGetAllHabits(),
  },
}));

const mockSignOut = jest.fn();
jest.mock('@/src/store', () => ({
  useAuthStore: () => ({
    user: { displayName: 'Test User', email: 'test@example.com' },
    signOut: mockSignOut,
  }),
}));

const mockClearAllImages = jest.fn().mockResolvedValue(undefined);
jest.mock('@/src/utils/imagePersist', () => ({
  clearAllImages: () => mockClearAllImages(),
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

    await waitFor(
      () => {
        expect(mockSetApiKey).toHaveBeenCalledWith('sk-ant-test123');
      },
      { timeout: 5000 },
    );
    await waitFor(
      () => {
        expect(Alert.alert).toHaveBeenCalledWith('Success', 'API key saved successfully');
      },
      { timeout: 5000 },
    );
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

    await waitFor(
      () => {
        expect(mockShareExportedData).toHaveBeenCalled();
      },
      { timeout: 5000 },
    );
  });

  it('shows export failed alert when export throws', async () => {
    mockShareExportedData.mockRejectedValue(new Error('Export error'));
    const { findByText } = renderWithTheme();

    fireEvent.press(await findByText('Export All Data'));

    await waitFor(
      () => {
        expect(Alert.alert).toHaveBeenCalledWith('Export Failed', 'Export error');
      },
      { timeout: 5000 },
    );
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

  it('clears persisted images when Clear All Data is confirmed', async () => {
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

    expect(mockClearAllImages).toHaveBeenCalled();
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

  it('shows delete API key confirmation when trash icon is pressed', async () => {
    mockHasApiKey.mockResolvedValue(true);
    const { findByText, getAllByTestId } = renderWithTheme();

    await findByText('API key configured');
    // First trash icon is the API key delete, second is Clear All Data
    const trashIcons = getAllByTestId('icon-trash2');
    fireEvent.press(trashIcons[0]);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Remove API Key',
      expect.stringContaining('remove your Claude API key'),
      expect.any(Array),
    );
  });

  it('deletes API key when confirmed', async () => {
    mockHasApiKey.mockResolvedValue(true);
    mockDeleteApiKey.mockResolvedValue(undefined);
    const { findByText, getAllByTestId } = renderWithTheme();

    await findByText('API key configured');
    const trashIcons = getAllByTestId('icon-trash2');
    fireEvent.press(trashIcons[0]);

    const alertCall = (Alert.alert as jest.Mock).mock.calls.find(
      (call) => call[0] === 'Remove API Key',
    );
    const removeButton = alertCall[2].find((btn: { text: string }) => btn.text === 'Remove');
    await removeButton.onPress();

    expect(mockDeleteApiKey).toHaveBeenCalled();
  });

  it('calls shareCSVExport when CSV export type is selected', async () => {
    mockShareCSVExport.mockResolvedValue(undefined);
    const { findByText } = renderWithTheme();

    fireEvent.press(await findByText('Export as CSV'));

    const alertCall = (Alert.alert as jest.Mock).mock.calls.find(
      (call) => call[0] === 'Export CSV',
    );
    const habitsButton = alertCall[2].find((btn: { text: string }) => btn.text === 'Habits');
    await habitsButton.onPress();

    await waitFor(
      () => {
        expect(mockShareCSVExport).toHaveBeenCalledWith('habits');
      },
      { timeout: 5000 },
    );
  });

  it('renders notification toggle', async () => {
    const { findByText } = renderWithTheme();
    await findByText('Notifications');
  });

  it('loads persisted notification preference on mount', async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage');

    renderWithTheme();

    await waitFor(
      () => {
        expect(AsyncStorage.getItem).toHaveBeenCalledWith('@trackr_notifications_enabled');
      },
      { timeout: 5000 },
    );
  });

  it('persists notification toggle to AsyncStorage when changed', async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    const { getByTestId, findByText } = renderWithTheme();

    await findByText('Notifications');

    const notifSwitch = getByTestId('notification-toggle');
    fireEvent(notifSwitch, 'valueChange', false);

    await waitFor(
      () => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith('@trackr_notifications_enabled', 'false');
      },
      { timeout: 5000 },
    );
  });

  it('cancels all habit reminders when notifications toggled off', async () => {
    const { getByTestId, findByText } = renderWithTheme();
    await findByText('Notifications');

    const notifSwitch = getByTestId('notification-toggle');
    fireEvent(notifSwitch, 'valueChange', false);

    await waitFor(
      () => {
        expect(mockCancelAllHabitReminders).toHaveBeenCalled();
      },
      { timeout: 5000 },
    );
  });

  it('reschedules reminders for habits with reminderTime when toggled on', async () => {
    mockGetAllHabits.mockResolvedValue([
      { id: 'h1', name: 'Meditate', reminderTime: '09:00', color: '#FF0000', frequency: 'daily' },
      { id: 'h2', name: 'Read', color: '#00FF00', frequency: 'daily' },
    ]);

    const { getByTestId, findByText } = renderWithTheme();
    await findByText('Notifications');

    const notifSwitch = getByTestId('notification-toggle');
    fireEvent(notifSwitch, 'valueChange', true);

    await waitFor(
      () => {
        expect(mockScheduleHabitReminder).toHaveBeenCalledTimes(1);
        expect(mockScheduleHabitReminder).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'h1', reminderTime: '09:00' }),
        );
      },
      { timeout: 5000 },
    );
  });

  it('continues scheduling remaining habits if one fails', async () => {
    mockScheduleHabitReminder
      .mockRejectedValueOnce(new Error('Schedule failed'))
      .mockResolvedValueOnce('notif-id');

    mockGetAllHabits.mockResolvedValue([
      { id: 'h1', name: 'Meditate', reminderTime: '09:00', color: '#FF0000', frequency: 'daily' },
      { id: 'h2', name: 'Exercise', reminderTime: '18:00', color: '#00FF00', frequency: 'daily' },
    ]);

    const { getByTestId, findByText } = renderWithTheme();
    await findByText('Notifications');

    const notifSwitch = getByTestId('notification-toggle');
    fireEvent(notifSwitch, 'valueChange', true);

    await waitFor(
      () => {
        expect(mockScheduleHabitReminder).toHaveBeenCalledTimes(2);
      },
      { timeout: 5000 },
    );
  });
});
