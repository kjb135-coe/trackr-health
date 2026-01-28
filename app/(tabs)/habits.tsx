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
} from 'react-native';
import { Plus, Check, Trash2, X } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '@/src/theme';
import { Card, Button } from '@/src/components/ui';
import { useHabitStore } from '@/src/store';
import { getDateString, getRelativeDateLabel } from '@/src/utils/date';
import { HABIT_COLORS } from '@/src/utils/constants';
import { Habit } from '@/src/types';

export default function HabitsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [selectedColor, setSelectedColor] = useState(HABIT_COLORS[0]);
  const [streaks, setStreaks] = useState<Map<string, number>>(new Map());

  const {
    habits,
    todayCompletions,
    isLoading,
    loadHabits,
    loadTodayCompletions,
    createHabit,
    deleteHabit,
    toggleCompletion,
    getStreak,
  } = useHabitStore();

  const today = getDateString();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadStreaks();
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
    await toggleCompletion(habitId, today);
    // Reload streaks after toggle
    const streak = await getStreak(habitId);
    setStreaks((prev) => new Map(prev).set(habitId, streak));
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.dateLabel}>{getRelativeDateLabel(new Date())}</Text>

        {habits.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No habits yet</Text>
            <Text style={styles.emptySubtext}>Tap + to create your first habit</Text>
          </View>
        ) : (
          habits.map((habit) => {
            const isCompleted = todayCompletions.get(habit.id)?.completed;
            const streak = streaks.get(habit.id) || 0;

            return (
              <Card key={habit.id} style={styles.habitCard}>
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

                <View style={styles.habitInfo}>
                  <Text style={[styles.habitName, isCompleted && styles.completedText]}>
                    {habit.name}
                  </Text>
                  {streak > 0 && (
                    <Text style={styles.streakText}>{streak} day streak</Text>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteHabit(habit)}
                >
                  <Trash2 color={colors.gray400} size={18} />
                </TouchableOpacity>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Plus color={colors.white} size={24} />
      </TouchableOpacity>

      {/* Create Habit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Habit</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={colors.textPrimary} size={24} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Habit name"
              value={newHabitName}
              onChangeText={setNewHabitName}
              placeholderTextColor={colors.textTertiary}
              autoFocus
            />

            <Text style={styles.colorLabel}>Color</Text>
            <View style={styles.colorGrid}>
              {HABIT_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>

            <Button
              title="Create Habit"
              onPress={handleCreateHabit}
              disabled={!newHabitName.trim()}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  dateLabel: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.h4,
    color: colors.textSecondary,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textTertiary,
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
    ...typography.body,
    color: colors.textPrimary,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: colors.textTertiary,
  },
  streakText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
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
    backgroundColor: colors.habits,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
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
    backgroundColor: colors.white,
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
    ...typography.h3,
    color: colors.textPrimary,
  },
  input: {
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  colorLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: '500',
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
  colorSelected: {
    borderWidth: 3,
    borderColor: colors.textPrimary,
  },
});
