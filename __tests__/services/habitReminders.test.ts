import {
  requestNotificationPermissions,
  scheduleHabitReminder,
  cancelHabitReminder,
  cancelAllHabitReminders,
  getScheduledReminders,
  setupNotificationListeners,
} from '@/src/services/notifications/habitReminders';
import * as Notifications from 'expo-notifications';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
}));

describe('habitReminders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestNotificationPermissions', () => {
    it('returns true when already granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await requestNotificationPermissions();

      expect(result).toBe(true);
      expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it('requests permissions when not granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await requestNotificationPermissions();

      expect(result).toBe(true);
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });

    it('returns false when permissions denied', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const result = await requestNotificationPermissions();

      expect(result).toBe(false);
    });
  });

  describe('scheduleHabitReminder', () => {
    it('returns null when habit has no reminderTime', async () => {
      const result = await scheduleHabitReminder({
        id: 'habit-1',
        name: 'Test Habit',
        color: '#FF0000',
        frequency: 'daily',
        createdAt: '2026-02-18T00:00:00.000Z',
        updatedAt: '2026-02-18T00:00:00.000Z',
      });

      expect(result).toBeNull();
    });

    it('returns null when permissions denied', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });
      (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue([]);

      const result = await scheduleHabitReminder({
        id: 'habit-1',
        name: 'Test Habit',
        color: '#FF0000',
        frequency: 'daily',
        reminderTime: '09:00',
        createdAt: '2026-02-18T00:00:00.000Z',
        updatedAt: '2026-02-18T00:00:00.000Z',
      });

      expect(result).toBeNull();
    });

    it('schedules daily reminder and returns identifier', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue([]);
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notif-123');

      const result = await scheduleHabitReminder({
        id: 'habit-1',
        name: 'Meditate',
        color: '#FF0000',
        frequency: 'daily',
        reminderTime: '09:30',
        createdAt: '2026-02-18T00:00:00.000Z',
        updatedAt: '2026-02-18T00:00:00.000Z',
      });

      expect(result).toBe('notif-123');
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'Habit Reminder',
          body: 'Time to complete: Meditate',
          data: { habitId: 'habit-1', type: 'habit_reminder' },
          sound: true,
        },
        trigger: {
          type: 'daily',
          hour: 9,
          minute: 30,
        },
      });
    });
  });

  describe('cancelHabitReminder', () => {
    it('cancels notifications matching the habit ID', async () => {
      (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue([
        { identifier: 'notif-1', content: { data: { habitId: 'habit-1' } } },
        { identifier: 'notif-2', content: { data: { habitId: 'habit-2' } } },
      ]);

      await cancelHabitReminder('habit-1');

      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(1);
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('notif-1');
    });
  });

  describe('cancelAllHabitReminders', () => {
    it('cancels only habit_reminder type notifications', async () => {
      (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue([
        { identifier: 'notif-1', content: { data: { type: 'habit_reminder' } } },
        { identifier: 'notif-2', content: { data: { type: 'other' } } },
        { identifier: 'notif-3', content: { data: { type: 'habit_reminder' } } },
      ]);

      await cancelAllHabitReminders();

      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(2);
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('notif-1');
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('notif-3');
    });
  });

  describe('getScheduledReminders', () => {
    it('returns only habit_reminder notifications', async () => {
      (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue([
        { identifier: 'notif-1', content: { data: { type: 'habit_reminder' } } },
        { identifier: 'notif-2', content: { data: { type: 'other' } } },
      ]);

      const result = await getScheduledReminders();

      expect(result).toHaveLength(1);
      expect(result[0].identifier).toBe('notif-1');
    });
  });

  describe('setupNotificationListeners', () => {
    it('sets up listeners and returns cleanup function', () => {
      const mockRemoveReceived = jest.fn();
      const mockRemoveResponse = jest.fn();
      (Notifications.addNotificationReceivedListener as jest.Mock).mockReturnValue({
        remove: mockRemoveReceived,
      });
      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockReturnValue({
        remove: mockRemoveResponse,
      });

      const cleanup = setupNotificationListeners();

      expect(Notifications.addNotificationReceivedListener).toHaveBeenCalled();
      expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();

      cleanup();

      expect(mockRemoveReceived).toHaveBeenCalled();
      expect(mockRemoveResponse).toHaveBeenCalled();
    });
  });
});
