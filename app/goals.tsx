import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import { X, Moon, Dumbbell, UtensilsCrossed, Target, BookOpen } from 'lucide-react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { spacing, typography, borderRadius, useTheme, type ThemeColors } from '@/src/theme';
import { AnimatedCard, AnimatedButton } from '@/src/components/ui';
import { getErrorMessage } from '@/src/utils/date';
import { useGoalsStore } from '@/src/store';
import { Goals } from '@/src/store/goalsStore';
import { ANIMATION_DURATION, STAGGER_DELAY } from '@/src/utils/animations';

export default function GoalsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { goals, loadGoals, updateGoals, isLoading } = useGoalsStore();
  const [localGoals, setLocalGoals] = useState(goals);

  useEffect(() => {
    loadGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLocalGoals(goals);
  }, [goals]);

  const handleSave = async () => {
    try {
      await updateGoals(localGoals);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      Alert.alert('Save Failed', getErrorMessage(error));
    }
  };

  const updateLocalGoal = (key: keyof Goals, value: number) => {
    setLocalGoals((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Animated.View
        entering={FadeInDown.duration(ANIMATION_DURATION.screenEntrance).delay(
          STAGGER_DELAY.initialOffset,
        )}
        exiting={FadeOut.duration(ANIMATION_DURATION.exit)}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X color={colors.textSecondary} size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Your Goals</Text>
          <View style={styles.placeholder} />
        </View>

        <Text style={styles.description}>
          Set personalized targets for each area of your health journey.
        </Text>
      </Animated.View>

      {/* Sleep Goal */}
      <AnimatedCard style={styles.goalCard} delay={STAGGER_DELAY.listItem}>
        <View style={styles.goalHeader}>
          <View style={[styles.iconContainer, { backgroundColor: colors.sleep + '20' }]}>
            <Moon color={colors.sleep} size={24} />
          </View>
          <View style={styles.goalInfo}>
            <Text style={styles.goalTitle}>Daily Sleep</Text>
            <Text style={styles.goalValue}>{localGoals.sleepHours} hours</Text>
          </View>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={5}
          maximumValue={12}
          step={0.5}
          value={localGoals.sleepHours}
          onValueChange={(val) => updateLocalGoal('sleepHours', val)}
          minimumTrackTintColor={colors.sleep}
          maximumTrackTintColor={colors.borderLight}
          thumbTintColor={colors.sleep}
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabel}>5 hrs</Text>
          <Text style={styles.sliderLabel}>12 hrs</Text>
        </View>
      </AnimatedCard>

      {/* Exercise Goal */}
      <AnimatedCard style={styles.goalCard} delay={STAGGER_DELAY.listItem * 2}>
        <View style={styles.goalHeader}>
          <View style={[styles.iconContainer, { backgroundColor: colors.exercise + '20' }]}>
            <Dumbbell color={colors.exercise} size={24} />
          </View>
          <View style={styles.goalInfo}>
            <Text style={styles.goalTitle}>Weekly Exercise</Text>
            <Text style={styles.goalValue}>{localGoals.exerciseMinutesPerWeek} min/week</Text>
          </View>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={30}
          maximumValue={600}
          step={15}
          value={localGoals.exerciseMinutesPerWeek}
          onValueChange={(val) => updateLocalGoal('exerciseMinutesPerWeek', val)}
          minimumTrackTintColor={colors.exercise}
          maximumTrackTintColor={colors.borderLight}
          thumbTintColor={colors.exercise}
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabel}>30 min</Text>
          <Text style={styles.sliderLabel}>10 hrs</Text>
        </View>
      </AnimatedCard>

      {/* Calories Goal */}
      <AnimatedCard style={styles.goalCard} delay={STAGGER_DELAY.listItem * 3}>
        <View style={styles.goalHeader}>
          <View style={[styles.iconContainer, { backgroundColor: colors.nutrition + '20' }]}>
            <UtensilsCrossed color={colors.nutrition} size={24} />
          </View>
          <View style={styles.goalInfo}>
            <Text style={styles.goalTitle}>Daily Calories</Text>
            <Text style={styles.goalValue}>{localGoals.dailyCalories} cal</Text>
          </View>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={1200}
          maximumValue={4000}
          step={50}
          value={localGoals.dailyCalories}
          onValueChange={(val) => updateLocalGoal('dailyCalories', val)}
          minimumTrackTintColor={colors.nutrition}
          maximumTrackTintColor={colors.borderLight}
          thumbTintColor={colors.nutrition}
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabel}>1200</Text>
          <Text style={styles.sliderLabel}>4000</Text>
        </View>
      </AnimatedCard>

      {/* Protein Goal */}
      <AnimatedCard style={styles.goalCard} delay={STAGGER_DELAY.listItem * 4}>
        <View style={styles.goalHeader}>
          <View style={[styles.iconContainer, { backgroundColor: colors.success + '20' }]}>
            <Target color={colors.success} size={24} />
          </View>
          <View style={styles.goalInfo}>
            <Text style={styles.goalTitle}>Daily Protein</Text>
            <Text style={styles.goalValue}>{localGoals.dailyProtein}g</Text>
          </View>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={20}
          maximumValue={200}
          step={5}
          value={localGoals.dailyProtein}
          onValueChange={(val) => updateLocalGoal('dailyProtein', val)}
          minimumTrackTintColor={colors.success}
          maximumTrackTintColor={colors.borderLight}
          thumbTintColor={colors.success}
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabel}>20g</Text>
          <Text style={styles.sliderLabel}>200g</Text>
        </View>
      </AnimatedCard>

      {/* Habits Goal */}
      <AnimatedCard style={styles.goalCard} delay={STAGGER_DELAY.listItem * 5}>
        <View style={styles.goalHeader}>
          <View style={[styles.iconContainer, { backgroundColor: colors.habits + '20' }]}>
            <Target color={colors.habits} size={24} />
          </View>
          <View style={styles.goalInfo}>
            <Text style={styles.goalTitle}>Daily Habits</Text>
            <Text style={styles.goalValue}>{localGoals.habitsPerDay} habits</Text>
          </View>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={20}
          step={1}
          value={localGoals.habitsPerDay}
          onValueChange={(val) => updateLocalGoal('habitsPerDay', val)}
          minimumTrackTintColor={colors.habits}
          maximumTrackTintColor={colors.borderLight}
          thumbTintColor={colors.habits}
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabel}>1</Text>
          <Text style={styles.sliderLabel}>20</Text>
        </View>
      </AnimatedCard>

      {/* Journal Goal */}
      <AnimatedCard style={styles.goalCard} delay={STAGGER_DELAY.listItem * 6}>
        <View style={styles.goalHeader}>
          <View style={[styles.iconContainer, { backgroundColor: colors.journal + '20' }]}>
            <BookOpen color={colors.journal} size={24} />
          </View>
          <View style={styles.goalInfo}>
            <Text style={styles.goalTitle}>Weekly Journal</Text>
            <Text style={styles.goalValue}>{localGoals.journalEntriesPerWeek} entries/week</Text>
          </View>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={14}
          step={1}
          value={localGoals.journalEntriesPerWeek}
          onValueChange={(val) => updateLocalGoal('journalEntriesPerWeek', val)}
          minimumTrackTintColor={colors.journal}
          maximumTrackTintColor={colors.borderLight}
          thumbTintColor={colors.journal}
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabel}>1</Text>
          <Text style={styles.sliderLabel}>14</Text>
        </View>
      </AnimatedCard>

      <AnimatedButton
        title="Save Goals"
        onPress={handleSave}
        loading={isLoading}
        style={styles.saveButton}
      />
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: spacing.md,
      paddingBottom: spacing.xxl,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    closeButton: {
      padding: spacing.xs,
    },
    title: {
      ...typography.h2,
      color: colors.textPrimary,
    },
    placeholder: {
      width: 32,
    },
    description: {
      ...typography.body,
      color: colors.textSecondary,
      marginBottom: spacing.lg,
    },
    goalCard: {
      marginBottom: spacing.md,
      padding: spacing.md,
    },
    goalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    goalInfo: {
      flex: 1,
    },
    goalTitle: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: '600',
    },
    goalValue: {
      ...typography.h3,
      color: colors.primary,
    },
    slider: {
      width: '100%',
      height: 40,
    },
    sliderLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xs,
    },
    sliderLabel: {
      ...typography.caption,
      color: colors.textTertiary,
    },
    saveButton: {
      marginTop: spacing.lg,
    },
  });
