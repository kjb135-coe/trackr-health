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
  const [saving, setSaving] = useState(false);

  const { createHabit, updateHabit } = useHabitStore();

  React.useEffect(() => {
    if (editHabit) {
      setNewHabitName(editHabit.name);
      setSelectedColor(editHabit.color);
    } else {
      setNewHabitName('');
      setSelectedColor(HABIT_COLORS[0]);
    }
  }, [editHabit]);

  const handleSave = async () => {
    if (!newHabitName.trim()) return;

    setSaving(true);
    try {
      if (editHabit) {
        await updateHabit(editHabit.id, {
          name: newHabitName.trim(),
          color: selectedColor,
        });
      } else {
        await createHabit({
          name: newHabitName.trim(),
          color: selectedColor,
          frequency: 'daily',
        });
      }

      setNewHabitName('');
      setSelectedColor(HABIT_COLORS[0]);
      onClose();
    } catch (error) {
      Alert.alert('Save failed', getErrorMessage(error));
    }
    setSaving(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
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
    backgroundColor: 'rgba(0,0,0,0.5)',
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
});
