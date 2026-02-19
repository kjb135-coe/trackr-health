import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, borderRadius } from '@/src/theme';
import { AnimatedButton } from '@/src/components/ui';
import { useHabitStore } from '@/src/store';
import { HABIT_COLORS } from '@/src/utils/constants';

interface CreateHabitModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CreateHabitModal({ visible, onClose }: CreateHabitModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [newHabitName, setNewHabitName] = useState('');
  const [selectedColor, setSelectedColor] = useState(HABIT_COLORS[0]);

  const { createHabit } = useHabitStore();

  const handleCreateHabit = async () => {
    if (!newHabitName.trim()) return;

    await createHabit({
      name: newHabitName.trim(),
      color: selectedColor,
      frequency: 'daily',
    });

    setNewHabitName('');
    setSelectedColor(HABIT_COLORS[0]);
    onClose();
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
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>New Habit</Text>
            <TouchableOpacity onPress={onClose}>
              <X color={colors.textPrimary} size={24} />
            </TouchableOpacity>
          </View>

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
            title="Create Habit"
            onPress={handleCreateHabit}
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
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
