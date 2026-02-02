import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Dumbbell, X, Clock, Flame, Zap } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, borderRadius } from '@/src/theme';
import { AnimatedCard, AnimatedButton } from '@/src/components/ui';
import { useExerciseStore } from '@/src/store';
import { getDateString } from '@/src/utils/date';
import { ExerciseType, ExerciseIntensity } from '@/src/types';

const EXERCISE_TYPES: { id: ExerciseType; name: string; icon: string }[] = [
  { id: 'running', name: 'Running', icon: '🏃' },
  { id: 'cycling', name: 'Cycling', icon: '🚴' },
  { id: 'swimming', name: 'Swimming', icon: '🏊' },
  { id: 'weight_training', name: 'Weights', icon: '🏋️' },
  { id: 'yoga', name: 'Yoga', icon: '🧘' },
  { id: 'hiit', name: 'HIIT', icon: '💪' },
  { id: 'walking', name: 'Walking', icon: '🚶' },
  { id: 'other', name: 'Other', icon: '⚡' },
];

const INTENSITY_MAP: Record<number, ExerciseIntensity> = {
  1: 'low',
  2: 'low',
  3: 'moderate',
  4: 'high',
  5: 'very_high',
};

const INTENSITY_LABELS = ['Light', 'Moderate', 'Intense', 'Very Intense', 'Maximum'];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ExerciseTypeButton({ type, selected, onPress, color, surfaceColor }: {
  type: { id: ExerciseType; name: string; icon: string };
  selected: boolean;
  onPress: () => void;
  color: string;
  surfaceColor: string;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={() => {
        scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
        setTimeout(() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 400 });
        }, 100);
        onPress();
      }}
      style={[
        styles.typeButton,
        animatedStyle,
        { backgroundColor: selected ? color + '20' : surfaceColor },
        selected && { borderWidth: 2, borderColor: color },
      ]}
    >
      <Text style={styles.typeIcon}>{type.icon}</Text>
      <Text style={[styles.typeName, { color: selected ? color : colors.textSecondary, fontWeight: selected ? '600' : '400' }]}>
        {type.name}
      </Text>
    </AnimatedPressable>
  );
}

export default function LogExerciseScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { createSession } = useExerciseStore();

  const [selectedType, setSelectedType] = useState<ExerciseType | null>(null);
  const [duration, setDuration] = useState(30);
  const [intensity, setIntensity] = useState(3);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const estimateCalories = () => {
    const baseCaloriesPerMinute = {
      running: 11,
      cycling: 8,
      swimming: 10,
      weights: 5,
      yoga: 3,
      hiit: 12,
      walking: 4,
      other: 6,
    };
    const base = baseCaloriesPerMinute[selectedType as keyof typeof baseCaloriesPerMinute] || 6;
    const intensityMultiplier = 0.6 + (intensity / 5) * 0.8;
    return Math.round(base * duration * intensityMultiplier);
  };

  const handleSave = async () => {
    if (!selectedType) {
      Alert.alert('Error', 'Please select an exercise type');
      return;
    }

    setSaving(true);
    try {
      await createSession({
        date: getDateString(),
        type: selectedType,
        durationMinutes: duration,
        intensity: INTENSITY_MAP[intensity],
        caloriesBurned: estimateCalories(),
        notes: notes.trim() || undefined,
        distance: undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save exercise');
    }
    setSaving(false);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X color={colors.textSecondary} size={24} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Log Workout</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Exercise Type */}
      <Animated.View entering={FadeInDown.duration(400).delay(100)}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Exercise Type</Text>
        <View style={styles.typeGrid}>
          {EXERCISE_TYPES.map((type) => (
            <ExerciseTypeButton
              key={type.id}
              type={type}
              selected={selectedType === type.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedType(type.id);
              }}
              color={colors.exercise}
              surfaceColor={colors.surfaceSecondary}
            />
          ))}
        </View>
      </Animated.View>

      {/* Duration */}
      <Animated.View entering={FadeInDown.duration(400).delay(150)}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Duration</Text>
        <AnimatedCard style={styles.durationCard} delay={50}>
          <View style={styles.durationHeader}>
            <Clock color={colors.exercise} size={20} />
            <Text style={[styles.durationValue, { color: colors.textPrimary }]}>{duration} min</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={5}
            maximumValue={180}
            step={5}
            value={duration}
            onValueChange={(val) => setDuration(val)}
            minimumTrackTintColor={colors.exercise}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.exercise}
          />
          <View style={styles.sliderLabels}>
            <Text style={[styles.sliderLabel, { color: colors.textTertiary }]}>5 min</Text>
            <Text style={[styles.sliderLabel, { color: colors.textTertiary }]}>3 hrs</Text>
          </View>
        </AnimatedCard>
      </Animated.View>

      {/* Intensity */}
      <Animated.View entering={FadeInDown.duration(400).delay(200)}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Intensity</Text>
        <AnimatedCard style={styles.intensityCard} delay={100}>
          <View style={styles.intensityHeader}>
            <Zap color={colors.warning} size={20} />
            <Text style={[styles.intensityValue, { color: colors.textPrimary }]}>{INTENSITY_LABELS[intensity - 1]}</Text>
          </View>
          <View style={styles.intensityButtons}>
            {[1, 2, 3, 4, 5].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.intensityButton,
                  { backgroundColor: colors.surfaceSecondary },
                  intensity === level && { backgroundColor: colors.exercise },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIntensity(level);
                }}
              >
                <Text
                  style={[
                    styles.intensityButtonText,
                    { color: colors.textSecondary },
                    intensity === level && { color: '#FFFFFF' },
                  ]}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </AnimatedCard>
      </Animated.View>

      {/* Estimated Calories */}
      {selectedType && (
        <Animated.View entering={FadeInDown.duration(400).delay(250)}>
          <AnimatedCard style={[styles.caloriesCard, { backgroundColor: colors.error + '10' }]} delay={150}>
            <Flame color={colors.error} size={24} />
            <View style={styles.caloriesInfo}>
              <Text style={[styles.caloriesValue, { color: colors.error }]}>{estimateCalories()}</Text>
              <Text style={[styles.caloriesLabel, { color: colors.textTertiary }]}>estimated calories</Text>
            </View>
          </AnimatedCard>
        </Animated.View>
      )}

      {/* Notes */}
      <Animated.View entering={FadeInDown.duration(400).delay(300)}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Notes</Text>
        <TextInput
          style={[styles.notesInput, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary }]}
          value={notes}
          onChangeText={setNotes}
          placeholder="How was your workout?"
          placeholderTextColor={colors.textTertiary}
          multiline
          numberOfLines={3}
        />
      </Animated.View>

      {/* Save Button */}
      <Animated.View entering={FadeInDown.duration(400).delay(350)}>
        <AnimatedButton
          title="Save Workout"
          onPress={handleSave}
          loading={saving}
          style={styles.saveButton}
          fullWidth
        />
      </Animated.View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingTop: spacing.md,
  },
  closeButton: {
    padding: spacing.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  placeholder: {
    width: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeButton: {
    width: '23%',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  typeIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  typeName: {
    fontSize: 12,
  },
  durationCard: {
    padding: spacing.md,
  },
  durationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  durationValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    fontSize: 12,
  },
  intensityCard: {
    padding: spacing.md,
  },
  intensityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  intensityValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  intensityButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  intensityButton: {
    flex: 1,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intensityButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  caloriesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginTop: spacing.md,
  },
  caloriesInfo: {
    marginLeft: spacing.md,
  },
  caloriesValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  caloriesLabel: {
    fontSize: 12,
  },
  notesInput: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: spacing.xl,
  },
});
