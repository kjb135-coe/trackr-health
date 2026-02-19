import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Plus, Dumbbell, Sparkles, Flame, Clock, Zap } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, borderRadius } from '@/src/theme';
import { AnimatedCard, AnimatedButton } from '@/src/components/ui';
import { useExerciseStore, useAIInsightsStore } from '@/src/store';
import { formatDuration, getRelativeDateLabel } from '@/src/utils/date';
import { EXERCISE_TYPE_LABELS, INTENSITY_LABELS } from '@/src/utils/constants';
import { ExerciseIntensity } from '@/src/types';
import { hasApiKey } from '@/src/services/claude';
import { ExerciseLogModal, type ExercisePreFill } from '@/src/components/exercise';

export default function ExerciseScreen() {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalPreFill, setModalPreFill] = useState<ExercisePreFill | null>(null);
  const [apiKeyExists, setApiKeyExists] = useState(false);
  const [showRecommendation, setShowRecommendation] = useState(false);

  const { sessions, loadSessions } = useExerciseStore();
  const { exerciseRecommendation, isLoadingExercise, fetchExerciseRecommendation } =
    useAIInsightsStore();

  useEffect(() => {
    loadSessions();
    checkApiKey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkApiKey = async () => {
    const exists = await hasApiKey();
    setApiKeyExists(exists);
  };

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

  const openModal = (preFill?: ExercisePreFill) => {
    setModalPreFill(preFill || null);
    setModalVisible(true);
  };

  const recentSessions = sessions.slice(0, 10);

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
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Workouts</Text>
        </Animated.View>

        {recentSessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Dumbbell color={colors.exercise} size={48} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No workouts yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
              Tap + to log your exercise
            </Text>
          </View>
        ) : (
          recentSessions.map((session, index) => (
            <Animated.View key={session.id} entering={FadeInDown.duration(400).delay(index * 50)}>
              <AnimatedCard style={styles.sessionCard} delay={index * 50}>
                <View style={styles.sessionHeader}>
                  <Text style={[styles.sessionType, { color: colors.textPrimary }]}>
                    {EXERCISE_TYPE_LABELS[session.type] || session.type}
                  </Text>
                  <Text style={[styles.sessionDate, { color: colors.textSecondary }]}>
                    {getRelativeDateLabel(session.date)}
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
                    <Text style={[styles.statLabel, { color: colors.textTertiary }]}>
                      Intensity
                    </Text>
                  </View>
                  {session.caloriesBurned && (
                    <View style={styles.stat}>
                      <Text style={[styles.statValue, { color: colors.exercise }]}>
                        {session.caloriesBurned}
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.textTertiary }]}>
                        Calories
                      </Text>
                    </View>
                  )}
                </View>
              </AnimatedCard>
            </Animated.View>
          ))
        )}

        {/* AI Exercise Recommendation */}
        {apiKeyExists && (
          <Animated.View entering={FadeInDown.duration(400).delay(200)}>
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
                      💡 {exerciseRecommendation.reason}
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

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.exercise }]}
        onPress={() => openModal()}
      >
        <Plus color={colors.white} size={24} />
      </TouchableOpacity>

      <ExerciseLogModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        preFill={modalPreFill}
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
    paddingBottom: 100,
  },
  sectionTitle: {
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
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: spacing.xs,
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
  sessionDate: {
    fontSize: 12,
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
