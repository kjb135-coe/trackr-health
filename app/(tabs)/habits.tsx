import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Plus, Check, Trash2, Sparkles, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, borderRadius } from '@/src/theme';
import {
  AnimatedCard,
  DateNavigator,
  FAB,
  SkeletonCard,
  ErrorBanner,
  EmptyState,
} from '@/src/components/ui';
import { useHabitStore, useAIInsightsStore } from '@/src/store';
import {
  StreakBadge,
  StreakCelebration,
  MILESTONES,
  CreateHabitModal,
  HabitSuggestionsModal,
} from '@/src/components/habits';
import { subDays, format, parseISO } from 'date-fns';
import { getDateString } from '@/src/utils/date';
import { Habit } from '@/src/types';
import { TAB_CONTENT_PADDING_BOTTOM } from '@/src/utils/constants';
import { useApiKeyExists } from '@/src/services/claude';
import { ANIMATION_DURATION, STAGGER_DELAY } from '@/src/utils/animations';
import { cancelHabitReminder } from '@/src/services/notifications';

export default function HabitsScreen() {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>(undefined);
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const [streaks, setStreaks] = useState<Map<string, number>>(new Map());
  const [weeklyCompletions, setWeeklyCompletions] = useState<Map<string, Set<string>>>(new Map());
  const apiKeyExists = useApiKeyExists();
  const [selectedDate, setSelectedDate] = useState(getDateString());
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationStreak, setCelebrationStreak] = useState(0);
  const [celebrationHabitName, setCelebrationHabitName] = useState('');

  const {
    habits,
    todayCompletions,
    loadHabits,
    loadTodayCompletions,
    deleteHabit,
    toggleCompletion,
    getStreak,
    getAllStreaks,
    getWeeklyCompletions,
    isLoading,
    error,
    clearError,
  } = useHabitStore();

  const { habitSuggestions, fetchHabitSuggestions } = useAIInsightsStore();

  useEffect(() => {
    loadData(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadStreaks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits]);

  const loadData = async (date: string) => {
    await loadHabits();
    await loadTodayCompletions(date);
    const weekly = await getWeeklyCompletions(date);
    setWeeklyCompletions(weekly);
  };

  const handleDateChange = async (date: string) => {
    setSelectedDate(date);
    await loadTodayCompletions(date);
    const weekly = await getWeeklyCompletions(date);
    setWeeklyCompletions(weekly);
  };

  const loadStreaks = async () => {
    const allStreaks = await getAllStreaks();
    setStreaks(allStreaks);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(selectedDate);
    setRefreshing(false);
  };

  const handleDeleteHabit = (habit: Habit) => {
    Alert.alert('Delete Habit', `Are you sure you want to delete "${habit.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await cancelHabitReminder(habit.id);
          await deleteHabit(habit.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const handleToggle = async (habitId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const wasCompleted = todayCompletions.get(habitId)?.completed;
    await toggleCompletion(habitId, selectedDate);
    const streak = await getStreak(habitId);
    setStreaks((prev) => new Map(prev).set(habitId, streak));

    if (!wasCompleted && MILESTONES.includes(streak)) {
      const habit = habits.find((h) => h.id === habitId);
      if (habit) {
        setCelebrationStreak(streak);
        setCelebrationHabitName(habit.name);
        setShowCelebration(true);
      }
    }
  };

  const weekDates = React.useMemo(() => {
    const end = parseISO(selectedDate);
    return Array.from({ length: 7 }, (_, i) => format(subDays(end, 6 - i), 'yyyy-MM-dd'));
  }, [selectedDate]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <DateNavigator date={selectedDate} onDateChange={handleDateChange} />

        {error && <ErrorBanner error={error} onDismiss={clearError} />}

        {isLoading && habits.length === 0 ? (
          <>
            <SkeletonCard lines={2} style={{ marginBottom: spacing.sm }} />
            <SkeletonCard lines={2} style={{ marginBottom: spacing.sm }} />
            <SkeletonCard lines={2} style={{ marginBottom: spacing.sm }} />
          </>
        ) : habits.length === 0 ? (
          <EmptyState title="No habits yet" subtitle="Tap + to create your first habit" />
        ) : (
          habits.map((habit, index) => {
            const isCompleted = todayCompletions.get(habit.id)?.completed;
            const streak = streaks.get(habit.id) || 0;

            return (
              <AnimatedCard
                key={habit.id}
                style={styles.habitCard}
                delay={index * STAGGER_DELAY.listItem}
              >
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    { borderColor: habit.color },
                    isCompleted && { backgroundColor: habit.color },
                  ]}
                  onPress={() => handleToggle(habit.id)}
                >
                  {isCompleted && <Check color={colors.white} size={16} />}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.habitInfo}
                  onPress={() => {
                    setEditingHabit(habit);
                    setModalVisible(true);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.habitNameRow}>
                    <Text
                      style={[
                        styles.habitName,
                        { color: colors.textPrimary },
                        isCompleted && {
                          textDecorationLine: 'line-through',
                          color: colors.textTertiary,
                        },
                      ]}
                    >
                      {habit.name}
                    </Text>
                    {streak > 0 && <StreakBadge streak={streak} size="sm" />}
                  </View>
                  <View style={styles.weekDots}>
                    {weekDates.map((date) => {
                      const done = weeklyCompletions.get(habit.id)?.has(date);
                      return (
                        <View
                          key={date}
                          style={[
                            styles.dot,
                            { backgroundColor: done ? habit.color : colors.border },
                          ]}
                        />
                      );
                    })}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteHabit(habit)}
                >
                  <Trash2 color={colors.textTertiary} size={18} />
                </TouchableOpacity>
              </AnimatedCard>
            );
          })
        )}

        {/* AI Suggestions Section */}
        {apiKeyExists && (
          <Animated.View
            entering={FadeInDown.duration(ANIMATION_DURATION.screenEntrance).delay(
              STAGGER_DELAY.initialOffset + habits.length * STAGGER_DELAY.listItem + 100,
            )}
            exiting={FadeOut.duration(ANIMATION_DURATION.exit)}
          >
            <TouchableOpacity
              style={[styles.aiSection, { backgroundColor: colors.surfaceSecondary }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSuggestionsVisible(true);
                if (habitSuggestions.length === 0) {
                  fetchHabitSuggestions();
                }
              }}
            >
              <Sparkles color={colors.primary} size={20} />
              <Text style={[styles.aiSectionText, { color: colors.textPrimary }]}>
                Get AI Habit Suggestions
              </Text>
              <ChevronRight color={colors.textTertiary} size={20} />
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>

      <FAB
        color={colors.habits}
        onPress={() => setModalVisible(true)}
        icon={<Plus color={colors.white} size={24} />}
      />

      <CreateHabitModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingHabit(undefined);
        }}
        editHabit={editingHabit}
      />

      <StreakCelebration
        visible={showCelebration}
        streak={celebrationStreak}
        habitName={celebrationHabitName}
        onClose={() => setShowCelebration(false)}
      />

      <HabitSuggestionsModal
        visible={suggestionsVisible}
        onClose={() => setSuggestionsVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: TAB_CONTENT_PADDING_BOTTOM,
  },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  habitInfo: {
    flex: 1,
  },
  habitNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitName: {
    fontSize: 16,
  },
  weekDots: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  aiSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
  },
  aiSectionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    marginLeft: spacing.sm,
  },
});
