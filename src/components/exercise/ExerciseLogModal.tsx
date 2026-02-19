import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, borderRadius } from '@/src/theme';
import { AnimatedButton, ModalHeader } from '@/src/components/ui';
import { useExerciseStore } from '@/src/store';
import { getDateString, getErrorMessage } from '@/src/utils/date';
import { EXERCISE_TYPE_LABELS, INTENSITY_LABELS } from '@/src/utils/constants';
import { ExerciseType, ExerciseIntensity, ExerciseSession } from '@/src/types';

const EXERCISE_TYPES: ExerciseType[] = [
  'running',
  'walking',
  'cycling',
  'swimming',
  'weight_training',
  'yoga',
  'hiit',
  'cardio',
];

const INTENSITIES: ExerciseIntensity[] = ['low', 'moderate', 'high', 'very_high'];

export interface ExercisePreFill {
  duration?: string;
  calories?: string;
  intensity?: ExerciseIntensity;
}

interface ExerciseLogModalProps {
  visible: boolean;
  onClose: () => void;
  preFill?: ExercisePreFill | null;
  editSession?: ExerciseSession;
  date?: string;
}

export function ExerciseLogModal({
  visible,
  onClose,
  preFill,
  editSession,
  date,
}: ExerciseLogModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedType, setSelectedType] = useState<ExerciseType>(editSession?.type || 'running');
  const [duration, setDuration] = useState(editSession?.durationMinutes.toString() || '30');
  const [intensity, setIntensity] = useState<ExerciseIntensity>(
    editSession?.intensity || 'moderate',
  );
  const [calories, setCalories] = useState(editSession?.caloriesBurned?.toString() || '');
  const [saving, setSaving] = useState(false);

  const { createSession, updateSession } = useExerciseStore();

  // Apply pre-fill values when modal opens
  useEffect(() => {
    if (visible && preFill) {
      if (preFill.duration) setDuration(preFill.duration);
      if (preFill.calories) setCalories(preFill.calories);
      if (preFill.intensity) setIntensity(preFill.intensity);
    }
  }, [visible, preFill]);

  // Reset form when editSession changes
  useEffect(() => {
    if (editSession) {
      setSelectedType(editSession.type);
      setDuration(editSession.durationMinutes.toString());
      setIntensity(editSession.intensity);
      setCalories(editSession.caloriesBurned?.toString() || '');
    } else if (!preFill) {
      setSelectedType('running');
      setDuration('30');
      setIntensity('moderate');
      setCalories('');
    }
  }, [editSession, preFill]);

  const handleCreateSession = async () => {
    const durationMinutes = parseInt(duration, 10) || 0;
    if (durationMinutes <= 0) {
      Alert.alert('Invalid duration', 'Please enter a duration greater than 0 minutes.');
      return;
    }

    const parsedCalories = calories ? parseInt(calories, 10) : undefined;
    if (parsedCalories !== undefined && (isNaN(parsedCalories) || parsedCalories <= 0)) {
      Alert.alert('Invalid calories', 'Calories must be a positive number.');
      return;
    }

    setSaving(true);
    try {
      if (editSession) {
        await updateSession(editSession.id, {
          type: selectedType,
          durationMinutes,
          intensity,
          caloriesBurned: parsedCalories,
        });
      } else {
        await createSession({
          date: date || getDateString(),
          type: selectedType,
          durationMinutes,
          intensity,
          caloriesBurned: parsedCalories,
        });
      }

      setDuration('30');
      setCalories('');
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
          <ModalHeader title={editSession ? 'Edit Exercise' : 'Log Exercise'} onClose={onClose} />

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Exercise Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
            {EXERCISE_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeOption,
                  { backgroundColor: colors.surfaceSecondary },
                  selectedType === type && { backgroundColor: colors.exercise },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedType(type);
                }}
              >
                <Text
                  style={[
                    styles.typeText,
                    { color: colors.textSecondary },
                    selectedType === type && { color: colors.white, fontWeight: '600' },
                  ]}
                >
                  {EXERCISE_TYPE_LABELS[type]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Duration (minutes)
          </Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary },
            ]}
            value={duration}
            onChangeText={setDuration}
            keyboardType="number-pad"
            placeholder="30"
            placeholderTextColor={colors.textTertiary}
          />

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Intensity</Text>
          <View style={styles.intensityRow}>
            {INTENSITIES.map((int) => (
              <TouchableOpacity
                key={int}
                style={[
                  styles.intensityOption,
                  { backgroundColor: colors.surfaceSecondary },
                  intensity === int && { backgroundColor: colors.exercise },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIntensity(int);
                }}
              >
                <Text
                  style={[
                    styles.intensityText,
                    { color: colors.textSecondary },
                    intensity === int && { color: colors.white, fontWeight: '600' },
                  ]}
                >
                  {INTENSITY_LABELS[int]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Calories Burned (optional)
          </Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary },
            ]}
            value={calories}
            onChangeText={setCalories}
            keyboardType="number-pad"
            placeholder="200"
            placeholderTextColor={colors.textTertiary}
          />

          <AnimatedButton
            title={editSession ? 'Update Workout' : 'Save Workout'}
            onPress={handleCreateSession}
            loading={saving}
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
    maxHeight: '80%',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  input: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    marginBottom: spacing.lg,
  },
  typeScroll: {
    marginBottom: spacing.lg,
  },
  typeOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
  },
  typeText: {
    fontSize: 14,
  },
  intensityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  intensityOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  intensityText: {
    fontSize: 12,
  },
});
