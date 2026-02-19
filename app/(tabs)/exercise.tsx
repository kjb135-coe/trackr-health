import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Plus, Dumbbell, Sparkles, Flame, Clock, Zap } from 'lucide-react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, borderRadius } from '@/src/theme';
import {
  AnimatedCard,
  AnimatedButton,
  DateNavigator,
  FAB,
  SkeletonCard,
  ErrorBanner,
  EmptyState,
} from '@/src/components/ui';
import { useExerciseStore, useAIInsightsStore } from '@/src/store';
import { formatDuration, getDateString } from '@/src/utils/date';
import { subDays, format, parseISO } from 'date-fns';
import {
  EXERCISE_TYPE_LABELS,
  INTENSITY_LABELS,
  TAB_CONTENT_PADDING_BOTTOM,
} from '@/src/utils/constants';
import { ExerciseIntensity, ExerciseSession } from '@/src/types';
import { useApiKeyExists } from '@/src/services/claude';
import { ExerciseLogModal, type ExercisePreFill } from '@/src/components/exercise';
import { ANIMATION_DURATION, STAGGER_DELAY } from '@/src/utils/animations';

export default function ExerciseScreen() {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalPreFill, setModalPreFill] = useState<ExercisePreFill | null>(null);
  const [editSession, setEditSession] = useState<ExerciseSession | undefined>();
  const apiKeyExists = useApiKeyExists();
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getDateString());

  const { sessions, isLoading, error, loadSessions, deleteSession, clearError } =
    useExerciseStore();
  const { exerciseRecommendation, isLoadingExercise, fetchExerciseRecommendation } =
    useAIInsightsStore();

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGetRecommendation = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowRecommendation(true);
    await fetchExerciseRecommendation();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  };

  const handleDeleteSession = (id: string, type: string) => {
    Alert.alert('Delete Workout', `Delete this ${type} session?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteSession(id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const openModal = (preFill?: ExercisePreFill) => {
    setEditSession(undefined);
    setModalPreFill(preFill || null);
    setModalVisible(true);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  // Filter sessions for selected date
  const dateSessions = useMemo(
    () => sessions.filter((s) => s.date === selectedDate),
    [sessions, selectedDate],
  );

  // 7-day window for summary
  const { weekSessions, totalMinutes, totalCalories } = useMemo(() => {
    const start = format(subDays(parseISO(selectedDate), 6), 'yyyy-MM-dd');
    const week = sessions.filter((s) => s.date >= start && s.date <= selectedDate);
    return {
      weekSessions: week,
      totalMinutes: week.reduce((sum, s) => sum + s.durationMinutes, 0),
      totalCalories: week.reduce((sum, s) => sum + (s.caloriesBurned || 0), 0),
    };
  }, [sessions, selectedDate]);

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

        {weekSessions.length > 0 && (
          <AnimatedCard style={styles.summaryCard}>
            <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>7-Day Activity</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.exercise }]}>
                  {weekSessions.length}
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>Workouts</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.exercise }]}>
                  {formatDuration(totalMinutes)}
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>
                  Total Time
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.exercise }]}>
                  {totalCalories.toLocaleString()}
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>Calories</Text>
              </View>
            </View>
          </AnimatedCard>
        )}

        {isLoading && sessions.length === 0 ? (
          <>
            <SkeletonCard lines={2} style={{ marginBottom: spacing.sm }} />
            <SkeletonCard lines={2} style={{ marginBottom: spacing.sm }} />
          </>
        ) : dateSessions.length === 0 ? (
          <EmptyState
            icon={<Dumbbell color={colors.exercise} size={48} />}
            title="No workouts"
            subtitle="Tap + to log your exercise"
          />
        ) : (
          dateSessions.map((session, index) => (
            <AnimatedCard
              key={session.id}
              style={styles.sessionCard}
              delay={index * STAGGER_DELAY.listItem}
              onPress={() => {
                setEditSession(session);
                setModalPreFill(null);
                setModalVisible(true);
              }}
              onLongPress={() =>
                handleDeleteSession(session.id, EXERCISE_TYPE_LABELS[session.type] || session.type)
              }
            >
              <View style={styles.sessionHeader}>
                <Text style={[styles.sessionType, { color: colors.textPrimary }]}>
                  {EXERCISE_TYPE_LABELS[session.type] || session.type}
                </Text>
              </View>

              <View style={styles.sessionStats}>
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: colors.exercise }]}>
                    {formatDuration(session.durationMinutes)}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Duration</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: colors.exercise }]}>
                    {INTENSITY_LABELS[session.intensity]}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Intensity</Text>
                </View>
                {session.caloriesBurned && (
                  <View style={styles.stat}>
                    <Text style={[styles.statValue, { color: colors.exercise }]}>
                      {session.caloriesBurned}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Calories</Text>
                  </View>
                )}
              </View>
            </AnimatedCard>
          ))
        )}

        {/* AI Exercise Recommendation */}
        {apiKeyExists && (
          <Animated.View
            entering={FadeInDown.duration(ANIMATION_DURATION.screenEntrance).delay(
              STAGGER_DELAY.initialOffset + STAGGER_DELAY.section * 3,
            )}
            exiting={FadeOut.duration(ANIMATION_DURATION.exit)}
          >
            {!showRecommendation ? (
              <TouchableOpacity
                style={[styles.aiSection, { backgroundColor: colors.surfaceSecondary }]}
                onPress={handleGetRecommendation}
              >
                <Sparkles color={colors.exercise} size={20} />
                <Text style={[styles.aiSectionText, { color: colors.textPrimary }]}>
                  Get Workout Recommendation
                </Text>
              </TouchableOpacity>
            ) : (
              <AnimatedCard style={styles.recCard} delay={100}>
                <View style={styles.recHeader}>
                  <Sparkles color={colors.exercise} size={20} />
                  <Text style={[styles.recTitle, { color: colors.textPrimary }]}>
                    {"Today's Workout"}
                  </Text>
                </View>

                {isLoadingExercise ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color={colors.exercise} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                      Analyzing your routine...
                    </Text>
                  </View>
                ) : exerciseRecommendation ? (
                  <>
                    <Text style={[styles.workoutType, { color: colors.exercise }]}>
                      {exerciseRecommendation.type}
                    </Text>

                    <View style={styles.recStats}>
                      <View style={[styles.recStat, { backgroundColor: colors.exercise + '10' }]}>
                        <Clock color={colors.exercise} size={16} />
                        <Text style={[styles.recStatValue, { color: colors.textPrimary }]}>
                          {exerciseRecommendation.duration} min
                        </Text>
                      </View>
                      <View style={[styles.recStat, { backgroundColor: colors.exercise + '10' }]}>
                        <Zap color={colors.exercise} size={16} />
                        <Text style={[styles.recStatValue, { color: colors.textPrimary }]}>
                          {exerciseRecommendation.intensity.charAt(0).toUpperCase() +
                            exerciseRecommendation.intensity.slice(1)}
                        </Text>
                      </View>
                      <View style={[styles.recStat, { backgroundColor: colors.exercise + '10' }]}>
                        <Flame color={colors.exercise} size={16} />
                        <Text style={[styles.recStatValue, { color: colors.textPrimary }]}>
                          ~{exerciseRecommendation.targetCalories} cal
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.recReason, { color: colors.textSecondary }]}>
                      {exerciseRecommendation.reason}
                    </Text>

                    <View style={styles.recButtons}>
                      <AnimatedButton
                        title="Log This Workout"
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          const intensityMap: Record<string, ExerciseIntensity> = {
                            low: 'low',
                            medium: 'moderate',
                            high: 'high',
                          };
                          openModal({
                            duration: exerciseRecommendation.duration.toString(),
                            calories: exerciseRecommendation.targetCalories.toString(),
                            intensity: intensityMap[exerciseRecommendation.intensity] || 'moderate',
                          });
                        }}
                        style={{ flex: 1, marginRight: spacing.sm }}
                      />
                      <AnimatedButton
                        title="New"
                        variant="secondary"
                        onPress={handleGetRecommendation}
                        loading={isLoadingExercise}
                        style={{ width: 70 }}
                      />
                    </View>
                  </>
                ) : null}
              </AnimatedCard>
            )}
          </Animated.View>
        )}
      </ScrollView>

      <FAB
        color={colors.exercise}
        onPress={() => openModal()}
        icon={<Plus color={colors.white} size={24} />}
      />

      <ExerciseLogModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditSession(undefined);
        }}
        preFill={modalPreFill}
        editSession={editSession}
        date={selectedDate}
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
  summaryCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  sessionCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sessionType: {
    fontSize: 16,
    fontWeight: '600',
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
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
  recCard: {
    padding: spacing.md,
    marginTop: spacing.md,
  },
  recHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  recTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  loadingText: {
    marginLeft: spacing.sm,
    fontSize: 14,
  },
  workoutType: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  recStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  recStat: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  recStatValue: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  recReason: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  recButtons: {
    flexDirection: 'row',
  },
});
