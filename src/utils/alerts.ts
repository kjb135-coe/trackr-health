import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';

/** Show a destructive delete confirmation dialog with Cancel/Delete buttons.
 *  Calls onConfirm and triggers haptic success when Delete is pressed. */
export function confirmDelete(
  title: string,
  message: string,
  onConfirm: () => Promise<void>,
): void {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: async () => {
        await onConfirm();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
    },
  ]);
}
