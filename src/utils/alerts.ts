import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';

/** Show a destructive delete confirmation dialog with Cancel and a destructive button.
 *  Calls onConfirm and triggers haptic success when the destructive button is pressed.
 *  @param buttonText defaults to "Delete" — pass custom text for non-delete destructive actions. */
export function confirmDelete(
  title: string,
  message: string,
  onConfirm: () => Promise<void>,
  buttonText = 'Delete',
): void {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: buttonText,
      style: 'destructive',
      onPress: async () => {
        await onConfirm();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
    },
  ]);
}
