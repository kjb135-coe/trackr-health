import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { confirmDelete } from '@/src/utils/alerts';

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  NotificationFeedbackType: { Success: 'success' },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('confirmDelete', () => {
  it('shows Alert with title, message, Cancel, and Delete buttons', () => {
    jest.spyOn(Alert, 'alert');
    const onConfirm = jest.fn();

    confirmDelete('Delete Item', 'Are you sure?', onConfirm);

    expect(Alert.alert).toHaveBeenCalledWith('Delete Item', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      expect.objectContaining({ text: 'Delete', style: 'destructive' }),
    ]);
  });

  it('calls onConfirm and haptic feedback when Delete is pressed', async () => {
    jest.spyOn(Alert, 'alert');
    const onConfirm = jest.fn().mockResolvedValue(undefined);

    confirmDelete('Delete', 'Sure?', onConfirm);

    // Extract the onPress handler from the Delete button
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const deleteButton = alertCall[2][1];
    await deleteButton.onPress();

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(
      Haptics.NotificationFeedbackType.Success,
    );
  });

  it('does not call onConfirm when Cancel is pressed', () => {
    jest.spyOn(Alert, 'alert');
    const onConfirm = jest.fn();

    confirmDelete('Delete', 'Sure?', onConfirm);

    // Cancel button has no onPress
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const cancelButton = alertCall[2][0];
    expect(cancelButton.text).toBe('Cancel');
    expect(cancelButton.style).toBe('cancel');
    expect(cancelButton.onPress).toBeUndefined();
  });

  it('shows error alert and skips haptic when onConfirm throws', async () => {
    jest.spyOn(Alert, 'alert');
    const onConfirm = jest.fn().mockRejectedValue(new Error('Delete failed'));

    confirmDelete('Delete', 'Sure?', onConfirm);

    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const deleteButton = alertCall[2][1];
    await deleteButton.onPress();

    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
    // Should show error alert
    const errorCall = (Alert.alert as jest.Mock).mock.calls.find((call) => call[0] === 'Error');
    expect(errorCall).toBeDefined();
    expect(errorCall[1]).toBe('Delete failed');
  });

  it('uses custom buttonText when provided', () => {
    jest.spyOn(Alert, 'alert');
    const onConfirm = jest.fn();

    confirmDelete(
      'Clear All Data',
      'This will permanently delete everything.',
      onConfirm,
      'Delete Everything',
    );

    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const deleteButton = alertCall[2][1];
    expect(deleteButton.text).toBe('Delete Everything');
    expect(deleteButton.style).toBe('destructive');
  });
});
