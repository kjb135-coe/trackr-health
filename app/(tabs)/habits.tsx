import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Plus, Check, Trash2, X, Sparkles, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, borderRadius } from '@/src/theme';
import { AnimatedCard, AnimatedButton } from '@/src/components/ui';
import { useHabitStore, useAIInsightsStore } from '@/src/store';
import { StreakBadge, StreakCelebration, MILESTONES } from '@/src/components/habits';
import { getDateString, getRelativeDateLabel } from '@/src/utils/date';
import { HABIT_COLORS } from '@/src/utils/constants';
import { Habit } from '@/src/types';
import { hasApiKey } from '@/src/services/claude';

export default function HabitsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [selectedColor, setSelectedColor] = useState(HABIT_COLORS[0]);
  const [streaks, setStreaks] = useState<Map<string, number>>(new Map());
  const [apiKeyExists, setApiKeyExists] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationStreak, setCelebrationStreak] = useState(0);
  const [celebrationHabitName, setCelebrationHabitName] = useState('');

  const {
    habits,
    todayCompletions,
    loadHabits,
    loadTodayCompletions,
    createHabit,
    deleteHabit,
    toggleCompletion,
    getStreak,
  } = useHabitStore();

  const { habitSuggestions, isLoadingHabits, fetchHabitSuggestions } = useAIInsightsStore();

  const today = getDateString();

  useEffect(() => {
    loadData();
    checkApiKey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkApiKey = async () => {
    const exists = await hasApiKey();
    setApiKeyExists(exists);
  };

  useEffect(() => {
    loadStreaks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits]);

  const loadData = async () => {
    await loadHabits();
    await loadTodayCompletions();
  };

  const loadStreaks = async () => {
    const newStreaks = new Map<string, number>();
    for (const habit of habits) {
      const streak = await getStreak(habit.id);
      newStreaks.set(habit.id, streak);
    }
    setStreaks(newStreaks);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateHabit = async () => {
    if (!newHabitName.trim()) return;

    await createHabit({
      name: newHabitName.trim(),
      color: selectedColor,
      frequency: 'daily',
    });

    setNewHabitName('');
    setSelectedColor(HABIT_COLORS[0]);
    setModalVisible(false);
  };

  const handleDeleteHabit = (habit: Habit) => {
    Alert.alert('Delete Habit', `Are you sure you want to delete "${habit.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteHabit(habit.id),
      },
    ]);
  };

  const handleToggle = async (habitId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const wasCompleted = todayCompletions.get(habitId)?.completed;
    await toggleCompletion(habitId, today);
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
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={[styles.dateLabel, { color: colors.textPrimary }]}>
            {getRelativeDateLabel(new Date())}
          </Text>
        </Animated.View>

        {habits.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No habits yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
              Tap + to create your first habit
            </Text>
          </View>
        ) : (
          habits.map((habit, index) => {
            const isCompleted = todayCompletions.get(habit.id)?.completed;
            const streak = streaks.get(habit.id) || 0;

            return (
              <Animated.View key={habit.id} entering={FadeInDown.duration(400).delay(index * 50)}>
                <AnimatedCard style={styles.habitCard} delay={index * 50}>
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      { borderColor: habit.color },
                      isCompleted && { backgroundColor: habit.color },
                    ]}
                    onPress={() => handleToggle(habit.id)}
                  >
                    {isCompleted && <Check color="#FFFFFF" size={16} />}
                  </TouchableOpacity>

                  <View style={styles.habitInfo}>
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

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteHabit(habit)}
                  >
                    <Trash2 color={colors.textTertiary} size={18} />
                  </TouchableOpacity>
                </AnimatedCard>
              </Animated.View>
            );
          })
        )}

        {/* AI Suggestions Section */}
        {apiKeyExists && (
          <Animated.View entering={FadeInDown.duration(400).delay(habits.length * 50 + 100)}>
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

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.habits }]}
        onPress={() => setModalVisible(true)}
      >
        <Plus color="#FFFFFF" size={24} />
      </TouchableOpacity>

      {/* Create Habit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
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
              <TouchableOpacity onPress={() => setModalVisible(false)}>
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
        </View>
      </Modal>

      {/* Streak Celebration */}
      <StreakCelebration
        visible={showCelebration}
        streak={celebrationStreak}
        habitName={celebrationHabitName}
        onClose={() => setShowCelebration(false)}
      />

      {/* AI Suggestions Modal */}
      <Modal visible={suggestionsVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
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
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Sparkles color={colors.primary} size={20} />
                <Text
                  style={[styles.modalTitle, { color: colors.textPrimary, marginLeft: spacing.sm }]}
                >
                  AI Suggestions
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSuggestionsVisible(false)}>
                <X color={colors.textPrimary} size={24} />
              </TouchableOpacity>
            </View>

            {isLoadingHabits ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Analyzing your routine...
                </Text>
              </View>
            ) : habitSuggestions.length > 0 ? (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
                {habitSuggestions.map((suggestion, index) => (
                  <Animated.View key={index} entering={FadeInDown.duration(300).delay(index * 100)}>
                    <AnimatedCard style={styles.suggestionCard} delay={index * 50}>
                      <Text style={[styles.suggestionName, { color: colors.textPrimary }]}>
                        {suggestion.name}
                      </Text>
                      <Text style={[styles.suggestionDesc, { color: colors.textSecondary }]}>
                        {suggestion.description}
                      </Text>
                      <Text style={[styles.suggestionReason, { color: colors.primary }]}>
                        💡 {suggestion.reason}
                      </Text>
                      <AnimatedButton
                        title="Add This Habit"
                        variant="secondary"
                        onPress={async () => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          await createHabit({
                            name: suggestion.name,
                            description: suggestion.description,
                            color: HABIT_COLORS[index % HABIT_COLORS.length],
                            frequency: suggestion.frequency,
                          });
                          Alert.alert(
                            'Success',
                            `"${suggestion.name}" has been added to your habits!`,
                          );
                        }}
                        style={{ marginTop: spacing.sm }}
                      />
                    </AnimatedCard>
                  </Animated.View>
                ))}
              </ScrollView>
            ) : (
              <Text style={[styles.noSuggestions, { color: colors.textSecondary }]}>
                No suggestions available. Try refreshing.
              </Text>
            )}

            <AnimatedButton
              title="Get New Suggestions"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                fetchHabitSuggestions();
              }}
              loading={isLoadingHabits}
              fullWidth
              style={{ marginTop: spacing.md }}
            />
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  dateLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: spacing.xs,
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
  habitName: {
    fontSize: 16,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
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
  loadingContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 14,
  },
  suggestionCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  suggestionDesc: {
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  suggestionReason: {
    fontSize: 13,
    fontWeight: '500',
  },
  noSuggestions: {
    textAlign: 'center',
    padding: spacing.lg,
    fontSize: 14,
  },
});
