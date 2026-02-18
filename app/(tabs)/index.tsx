import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Target, Moon, Dumbbell, UtensilsCrossed, BookOpen, Sparkles } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  FadeIn,
  FadeInDown,
  Layout,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, typography, borderRadius } from '@/src/theme';
import { AnimatedCard, AnimatedButton, SkeletonCard } from '@/src/components/ui';
import { QuickActions, WeeklyInsights, AICoaching } from '@/src/components/dashboard';
import {
  useHabitStore,
  useSleepStore,
  useExerciseStore,
  useNutritionStore,
  useJournalStore,
} from '@/src/store';
import { getDateString, formatDuration, getRelativeDateLabel } from '@/src/utils/date';
import { getDatabase } from '@/src/database';
import { populateDemoData } from '@/src/utils/demoData';
import { getTrendData, type TrendData } from '@/src/services/insights';

interface DashboardCardProps {
  title: string;
  value: string;
  subtitle?: string;
  color: string;
  Icon: typeof Target;
  onPress: () => void;
  progress?: number;
  delay?: number;
}

function DashboardCard({
  title,
  value,
  subtitle,
  color,
  Icon,
  onPress,
  progress,
  delay = 0,
}: DashboardCardProps) {
  const { colors } = useTheme();

  return (
    <AnimatedCard style={styles.card} onPress={onPress} delay={delay} haptic>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Icon color={color} size={24} />
      </View>
      <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>{title}</Text>
      <Text style={[styles.cardValue, { color: colors.textPrimary }]}>{value}</Text>
      {subtitle && (
        <Text style={[styles.cardSubtext, { color: colors.textTertiary }]}>{subtitle}</Text>
      )}
      {progress !== undefined && (
        <View style={[styles.progressBar, { backgroundColor: colors.surfaceSecondary }]}>
          <Animated.View
            style={[
              styles.progressFill,
              { backgroundColor: color, width: `${Math.min(progress * 100, 100)}%` },
            ]}
          />
        </View>
      )}
    </AnimatedCard>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [dbReady, setDbReady] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [trendData, setTrendData] = useState<TrendData | null>(null);

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
    try {
      const trends = await getTrendData();
      setTrendData(trends);
    } catch {
      // Silent fail - trends are supplementary
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadAll();
    setRefreshing(false);
  };

  const handleLoadDemo = async () => {
    setLoadingDemo(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await populateDemoData();
      await loadAll();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Demo data has been loaded!');
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to load demo data');
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
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
        <SkeletonCard style={{ marginBottom: spacing.md }} />
        <View style={styles.grid}>
          <SkeletonCard lines={2} style={styles.card} />
          <SkeletonCard lines={2} style={styles.card} />
          <SkeletonCard lines={2} style={styles.card} />
          <SkeletonCard lines={2} style={styles.card} />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <Animated.Text
        entering={FadeInDown.duration(400).delay(100)}
        style={[styles.dateLabel, { color: colors.textSecondary }]}
      >
        {getRelativeDateLabel(new Date())}
      </Animated.Text>

      <View style={styles.grid}>
        <DashboardCard
          title="Habits"
          value={`${completedHabits}/${habits.length}`}
          color={colors.habits}
          Icon={Target}
          onPress={() => router.push('/(tabs)/habits')}
          progress={habitProgress}
          delay={50}
        />

        <DashboardCard
          title="Sleep"
          value={todaySleep ? formatDuration(todaySleep.durationMinutes) : '—'}
          subtitle={todaySleep ? `Quality: ${todaySleep.quality}/5` : undefined}
          color={colors.sleep}
          Icon={Moon}
          onPress={() => router.push('/(tabs)/sleep')}
          delay={100}
        />

        <DashboardCard
          title="Exercise"
          value={totalExerciseMinutes > 0 ? formatDuration(totalExerciseMinutes) : '—'}
          subtitle={
            todayExercise.length > 0
              ? `${todayExercise.length} workout${todayExercise.length !== 1 ? 's' : ''}`
              : undefined
          }
          color={colors.exercise}
          Icon={Dumbbell}
          onPress={() => router.push('/(tabs)/exercise')}
          delay={150}
        />

        <DashboardCard
          title="Nutrition"
          value={dailyTotals.calories > 0 ? `${dailyTotals.calories}` : '—'}
          subtitle={dailyTotals.calories > 0 ? 'calories' : undefined}
          color={colors.nutrition}
          Icon={UtensilsCrossed}
          onPress={() => router.push('/(tabs)/nutrition')}
          delay={200}
        />
      </View>

      <Animated.View entering={FadeInDown.duration(400).delay(250)}>
        <AnimatedCard
          style={styles.journalCard}
          onPress={() => router.push('/(tabs)/journal')}
          delay={250}
          haptic
        >
          <View style={[styles.iconContainer, { backgroundColor: colors.journal + '20' }]}>
            <BookOpen color={colors.journal} size={24} />
          </View>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Journal</Text>
          <Text style={[styles.cardValue, { color: colors.textPrimary }]}>
            {todayJournalCount > 0
              ? `${todayJournalCount} entr${todayJournalCount !== 1 ? 'ies' : 'y'}`
              : 'No entries yet'}
          </Text>
        </AnimatedCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(300)}>
        <QuickActions />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(350)}>
        <AICoaching onSetupApiKey={() => router.push('/settings')} />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(400)}>
        <WeeklyInsights
          insights={[
            {
              label: 'Habits',
              current: trendData?.thisWeek.habitsCompleted ?? completedHabits,
              previous: trendData?.lastWeek.habitsCompleted ?? 0,
              unit: '',
              color: colors.habits,
              higherIsBetter: true,
            },
            {
              label: 'Sleep',
              current: Math.round((trendData?.thisWeek.avgSleepHours ?? 0) * 60),
              previous: Math.round((trendData?.lastWeek.avgSleepHours ?? 0) * 60),
              unit: ' min',
              color: colors.sleep,
              higherIsBetter: true,
            },
            {
              label: 'Exercise',
              current: trendData?.thisWeek.totalExerciseMinutes ?? totalExerciseMinutes,
              previous: trendData?.lastWeek.totalExerciseMinutes ?? 0,
              unit: ' min',
              color: colors.exercise,
              higherIsBetter: true,
            },
            {
              label: 'Calories',
              current: Math.round(trendData?.thisWeek.avgDailyCalories ?? dailyTotals.calories),
              previous: Math.round(trendData?.lastWeek.avgDailyCalories ?? 0),
              unit: '',
              color: colors.nutrition,
              higherIsBetter: false,
            },
          ]}
        />
      </Animated.View>

      {habits.length === 0 && (
        <Animated.View
          entering={FadeInDown.duration(400).delay(450)}
          style={[styles.demoSection, { backgroundColor: colors.surfaceSecondary }]}
        >
          <Sparkles color={colors.primary} size={32} style={{ marginBottom: spacing.sm }} />
          <Text style={[styles.demoTitle, { color: colors.textPrimary }]}>Welcome to Trackr</Text>
          <Text style={[styles.demoText, { color: colors.textSecondary }]}>
            Load sample data to explore all the features
          </Text>
          <AnimatedButton
            title="Load Demo Data"
            onPress={handleLoadDemo}
            loading={loadingDemo}
            variant="primary"
            fullWidth
            style={{ marginTop: spacing.md }}
          />
        </Animated.View>
      )}

      {/* Bottom padding for tab bar */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  dateLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  journalCard: {
    marginTop: spacing.md,
    padding: spacing.md,
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
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  cardSubtext: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 2,
  },
  progressBar: {
    height: 4,
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
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
  },
  demoTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  demoText: {
    fontSize: 15,
    textAlign: 'center',
  },
});
