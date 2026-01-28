import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Target, Moon, Dumbbell, UtensilsCrossed, BookOpen } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '@/src/theme';
import { Card, Button } from '@/src/components/ui';
import { useHabitStore, useSleepStore, useExerciseStore, useNutritionStore, useJournalStore } from '@/src/store';
import { getDateString, formatDuration, getRelativeDateLabel } from '@/src/utils/date';
import { getDatabase } from '@/src/database';
import { populateDemoData } from '@/src/utils/demoData';

export default function DashboardScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [dbReady, setDbReady] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);

  const { habits, todayCompletions, loadHabits, loadTodayCompletions } = useHabitStore();
  const { entries: sleepEntries, loadEntries: loadSleep } = useSleepStore();
  const { sessions: exerciseSessions, loadSessions: loadExercise } = useExerciseStore();
  const { dailyTotals, loadDailyTotals } = useNutritionStore();
  const { entries: journalEntries, loadEntries: loadJournal } = useJournalStore();

  const today = getDateString();

  useEffect(() => {
    async function init() {
      await getDatabase();
      setDbReady(true);
      await loadAll();
    }
    init();
  }, []);

  const loadAll = async () => {
    await Promise.all([
      loadHabits(),
      loadTodayCompletions(),
      loadSleep(),
      loadExercise(),
      loadDailyTotals(today),
      loadJournal(),
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const handleLoadDemo = async () => {
    setLoadingDemo(true);
    try {
      await populateDemoData();
      await loadAll();
      Alert.alert('Success', 'Demo data has been loaded!');
    } catch (error) {
      Alert.alert('Error', 'Failed to load demo data');
      console.error(error);
    }
    setLoadingDemo(false);
  };

  const completedHabits = habits.filter((h) => todayCompletions.get(h.id)?.completed).length;
  const habitProgress = habits.length > 0 ? completedHabits / habits.length : 0;

  const todaySleep = sleepEntries.find((e) => e.date === today);
  const todayExercise = exerciseSessions.filter((s) => s.date === today);
  const totalExerciseMinutes = todayExercise.reduce((sum, s) => sum + s.durationMinutes, 0);

  const todayJournalCount = journalEntries.filter((e) => e.date === today).length;

  if (!dbReady) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.dateLabel}>{getRelativeDateLabel(new Date())}</Text>

      <View style={styles.grid}>
        {/* Habits Card */}
        <Card style={styles.card} onPress={() => router.push('/(tabs)/habits')}>
          <View style={[styles.iconContainer, { backgroundColor: colors.habits + '20' }]}>
            <Target color={colors.habits} size={24} />
          </View>
          <Text style={styles.cardTitle}>Habits</Text>
          <Text style={styles.cardValue}>
            {completedHabits}/{habits.length}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${habitProgress * 100}%`, backgroundColor: colors.habits }]} />
          </View>
        </Card>

        {/* Sleep Card */}
        <Card style={styles.card} onPress={() => router.push('/(tabs)/sleep')}>
          <View style={[styles.iconContainer, { backgroundColor: colors.sleep + '20' }]}>
            <Moon color={colors.sleep} size={24} />
          </View>
          <Text style={styles.cardTitle}>Sleep</Text>
          <Text style={styles.cardValue}>
            {todaySleep ? formatDuration(todaySleep.durationMinutes) : '—'}
          </Text>
          {todaySleep && (
            <Text style={styles.cardSubtext}>Quality: {todaySleep.quality}/5</Text>
          )}
        </Card>

        {/* Exercise Card */}
        <Card style={styles.card} onPress={() => router.push('/(tabs)/exercise')}>
          <View style={[styles.iconContainer, { backgroundColor: colors.exercise + '20' }]}>
            <Dumbbell color={colors.exercise} size={24} />
          </View>
          <Text style={styles.cardTitle}>Exercise</Text>
          <Text style={styles.cardValue}>
            {totalExerciseMinutes > 0 ? formatDuration(totalExerciseMinutes) : '—'}
          </Text>
          {todayExercise.length > 0 && (
            <Text style={styles.cardSubtext}>{todayExercise.length} workout{todayExercise.length !== 1 ? 's' : ''}</Text>
          )}
        </Card>

        {/* Nutrition Card */}
        <Card style={styles.card} onPress={() => router.push('/(tabs)/nutrition')}>
          <View style={[styles.iconContainer, { backgroundColor: colors.nutrition + '20' }]}>
            <UtensilsCrossed color={colors.nutrition} size={24} />
          </View>
          <Text style={styles.cardTitle}>Nutrition</Text>
          <Text style={styles.cardValue}>
            {dailyTotals.calories > 0 ? `${dailyTotals.calories}` : '—'}
          </Text>
          {dailyTotals.calories > 0 && <Text style={styles.cardSubtext}>calories</Text>}
        </Card>

        {/* Journal Card */}
        <Card style={[styles.card, styles.wideCard]} onPress={() => router.push('/(tabs)/journal')}>
          <View style={[styles.iconContainer, { backgroundColor: colors.journal + '20' }]}>
            <BookOpen color={colors.journal} size={24} />
          </View>
          <Text style={styles.cardTitle}>Journal</Text>
          <Text style={styles.cardValue}>
            {todayJournalCount > 0 ? `${todayJournalCount} entr${todayJournalCount !== 1 ? 'ies' : 'y'}` : 'No entries yet'}
          </Text>
        </Card>
      </View>

      {/* Demo Data Button */}
      {habits.length === 0 && (
        <View style={styles.demoSection}>
          <Text style={styles.demoText}>New here? Load some sample data to explore the app.</Text>
          <Button
            title="Load Demo Data"
            onPress={handleLoadDemo}
            loading={loadingDemo}
            variant="secondary"
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 100,
  },
  dateLabel: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  card: {
    width: '47%',
    padding: spacing.md,
  },
  wideCard: {
    width: '100%',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  cardValue: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  cardSubtext: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.gray200,
    borderRadius: 2,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  demoSection: {
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  demoText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
