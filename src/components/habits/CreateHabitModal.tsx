import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, borderRadius } from '@/src/theme';
import { AnimatedButton, ModalHeader } from '@/src/components/ui';
import { useHabitStore } from '@/src/store';
import { HABIT_COLORS } from '@/src/utils/constants';
import { getErrorMessage } from '@/src/utils/date';
import { Habit } from '@/src/types';
import { scheduleHabitReminder, cancelHabitReminder } from '@/src/services/notifications';

interface CreateHabitModalProps {
  visible: boolean;
  onClose: () => void;
  editHabit?: Habit;
}

export function CreateHabitModal({ visible, onClose, editHabit }: CreateHabitModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [newHabitName, setNewHabitName] = useState('');
  const [selectedColor, setSelectedColor] = useState(HABIT_COLORS[0]);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderHour, setReminderHour] = useState('09');
  const [reminderMinute, setReminderMinute] = useState('00');
  const [saving, setSaving] = useState(false);

  const { createHabit, updateHabit } = useHabitStore();

  React.useEffect(() => {
    if (editHabit) {
      setNewHabitName(editHabit.name);
      setSelectedColor(editHabit.color);
      if (editHabit.reminderTime) {
        setReminderEnabled(true);
        const [h, m] = editHabit.reminderTime.split(':');
        setReminderHour(h);
        setReminderMinute(m);
      } else {
        setReminderEnabled(false);
        setReminderHour('09');
        setReminderMinute('00');
      }
    } else {
      setNewHabitName('');
      setSelectedColor(HABIT_COLORS[0]);
      setReminderEnabled(false);
      setReminderHour('09');
      setReminderMinute('00');
    }
  }, [editHabit]);

  const handleSave = async () => {
    if (!newHabitName.trim()) return;

    const h = parseInt(reminderHour, 10);
    const m = parseInt(reminderMinute, 10);
    if (reminderEnabled && (isNaN(h) || h < 0 || h > 23 || isNaN(m) || m < 0 || m > 59)) {
      Alert.alert('Invalid time', 'Hours must be 0-23 and minutes 0-59.');
      return;
    }

    const reminderTime = reminderEnabled
      ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      : null;

    setSaving(true);
    try {
      if (editHabit) {
        await updateHabit(editHabit.id, {
          name: newHabitName.trim(),
          color: selectedColor,
          reminderTime,
        });
        // Update notification schedule
        if (reminderTime) {
          await scheduleHabitReminder({ ...editHabit, name: newHabitName.trim(), reminderTime });
        } else {
          await cancelHabitReminder(editHabit.id);
        }
      } else {
        const created = await createHabit({
          name: newHabitName.trim(),
          color: selectedColor,
          frequency: 'daily',
          reminderTime,
        });
        // Schedule notification for new habit
        if (reminderTime && created) {
          await scheduleHabitReminder(created);
        }
      }

      setNewHabitName('');
      setSelectedColor(HABIT_COLORS[0]);
      setReminderEnabled(false);
      setReminderHour('09');
      setReminderMinute('00');
      onClose();
    } catch (error) {
      Alert.alert('Save failed', getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
      >
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.surface,
              paddingBottom: Math.max(spacing.xxl, insets.bottom + spacing.md),
            },
          ]}
        >
          <ModalHeader title={editHabit ? 'Edit Habit' : 'New Habit'} onClose={onClose} />

          <TextInput
            accessibilityLabel="Habit name"
            style={[
              styles.input,
              { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary },
            ]}
            placeholder="Habit name"
            value={newHabitName}
            onChangeText={setNewHabitName}
            placeholderTextColor={colors.textTertiary}
            autoFocus
          />

          <Text style={[styles.colorLabel, { color: colors.textSecondary }]}>Color</Text>
          <View style={styles.colorGrid}>
            {HABIT_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  selectedColor === color && { borderWidth: 3, borderColor: colors.textPrimary },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedColor(color);
                }}
              />
            ))}
          </View>

          <View style={styles.reminderRow}>
            <Text style={[styles.colorLabel, { color: colors.textSecondary, marginBottom: 0 }]}>
              Daily Reminder
            </Text>
            <Switch
              testID="reminder-toggle"
              value={reminderEnabled}
              onValueChange={setReminderEnabled}
              trackColor={{ false: colors.borderLight, true: colors.primary + '80' }}
              thumbColor={reminderEnabled ? colors.primary : colors.textTertiary}
            />
          </View>

          {reminderEnabled && (
            <View style={styles.timeRow}>
              <TextInput
                accessibilityLabel="Reminder hour"
                style={[
                  styles.timeInput,
                  { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary },
                ]}
                value={reminderHour}
                onChangeText={setReminderHour}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="HH"
                placeholderTextColor={colors.textTertiary}
              />
              <Text style={[styles.timeSeparator, { color: colors.textPrimary }]}>:</Text>
              <TextInput
                accessibilityLabel="Reminder minute"
                style={[
                  styles.timeInput,
                  { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary },
                ]}
                value={reminderMinute}
                onChangeText={setReminderMinute}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="MM"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          )}

          <AnimatedButton
            title={editHabit ? 'Update Habit' : 'Create Habit'}
            onPress={handleSave}
            loading={saving}
            disabled={!newHabitName.trim()}
            fullWidth
          />
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  input: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    marginBottom: spacing.lg,
  },
  colorLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  timeInput: {
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: 18,
    textAlign: 'center',
    width: 52,
  },
  timeSeparator: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: spacing.xs,
  },
});
