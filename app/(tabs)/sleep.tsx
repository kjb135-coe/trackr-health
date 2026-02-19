import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Plus, Moon, Sparkles, TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react-native';
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
import { useSleepStore, useAIInsightsStore } from '@/src/store';
import { formatDuration, formatTime, getRelativeDateLabel, getDateString } from '@/src/utils/date';
import { subDays, format, parseISO } from 'date-fns';
import { QUALITY_LABELS, getQualityColor, TAB_CONTENT_PADDING_BOTTOM } from '@/src/utils/constants';
import { useApiKeyExists } from '@/src/services/claude';
import { SleepLogModal } from '@/src/components/sleep';
import { SleepEntry } from '@/src/types';
import { ANIMATION_DURATION, STAGGER_DELAY } from '@/src/utils/animations';

export default function SleepScreen() {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editEntry, setEditEntry] = useState<SleepEntry | undefined>();
  const apiKeyExists = useApiKeyExists();
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getDateString());

  const { entries, isLoading, error, loadEntries, deleteEntry, clearError } = useSleepStore();
  const { sleepAnalysis, isLoadingSleep, fetchSleepAnalysis } = useAIInsightsStore();

  useEffect(() => {
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGetAnalysis = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAnalysis(true);
    await fetchSleepAnalysis();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEntries();
    setRefreshing(false);
  };

  const handleDeleteEntry = (id: string, date: string) => {
    Alert.alert('Delete Sleep Entry', `Delete sleep entry from ${date}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteEntry(id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  // Filter entries for selected date
  const dateEntry = useMemo(
    () => entries.find((e) => e.date === selectedDate),
    [entries, selectedDate],
  );

  // 7-day window ending on selected date for summary
  const { weekEntries, avgDuration, avgQuality } = useMemo(() => {
    const start = format(subDays(parseISO(selectedDate), 6), 'yyyy-MM-dd');
    const week = entries.filter((e) => e.date >= start && e.date <= selectedDate);
    return {
      weekEntries: week,
      avgDuration:
        week.length > 0
          ? Math.round(week.reduce((sum, e) => sum + e.durationMinutes, 0) / week.length)
          : 0,
      avgQuality:
        week.length > 0
          ? (week.reduce((sum, e) => sum + e.quality, 0) / week.length).toFixed(1)
          : '—',
    };
  }, [entries, selectedDate]);

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

        {weekEntries.length > 0 && (
          <AnimatedCard style={styles.summaryCard}>
            <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>7-Day Average</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.sleep }]}>
                  {formatDuration(avgDuration)}
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>Duration</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.sleep }]}>{avgQuality}</Text>
                <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>
                  Quality /5
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.sleep }]}>
                  {weekEntries.length}
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>Nights</Text>
              </View>
            </View>
          </AnimatedCard>
        )}

        {isLoading && entries.length === 0 ? (
          <SkeletonCard lines={3} style={{ marginBottom: spacing.sm }} />
        ) : !dateEntry ? (
          <EmptyState
            icon={<Moon color={colors.sleep} size={48} />}
            title="No sleep logged"
            subtitle="Tap + to log your sleep"
          />
        ) : (
          <AnimatedCard
            style={styles.entryCard}
            onPress={() => {
              setEditEntry(dateEntry);
              setModalVisible(true);
            }}
            onLongPress={() =>
              handleDeleteEntry(dateEntry.id, getRelativeDateLabel(dateEntry.date))
            }
          >
            <View style={styles.entryHeader}>
              <Text style={[styles.entryDate, { color: colors.textPrimary }]}>
                {getRelativeDateLabel(dateEntry.date)}
              </Text>
              <View
                style={[
                  styles.qualityBadge,
                  { backgroundColor: getQualityColor(dateEntry.quality, colors) },
                ]}
              >
                <Text style={[styles.qualityText, { color: colors.white }]}>
                  {QUALITY_LABELS[dateEntry.quality]}
                </Text>
              </View>
            </View>

            <View style={styles.entryStats}>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                  {formatDuration(dateEntry.durationMinutes)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Duration</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                  {formatTime(dateEntry.bedtime)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Bedtime</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                  {formatTime(dateEntry.wakeTime)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Wake</Text>
              </View>
            </View>
          </AnimatedCard>
        )}

        {/* AI Sleep Analysis */}
        {apiKeyExists && entries.length >= 3 && (
          <Animated.View
            entering={FadeInDown.duration(ANIMATION_DURATION.screenEntrance).delay(
              STAGGER_DELAY.initialOffset + STAGGER_DELAY.section * 3,
            )}
            exiting={FadeOut.duration(ANIMATION_DURATION.exit)}
          >
            {!showAnalysis ? (
              <TouchableOpacity
                style={[styles.aiSection, { backgroundColor: colors.surfaceSecondary }]}
                onPress={handleGetAnalysis}
              >
                <Sparkles color={colors.sleep} size={20} />
                <Text style={[styles.aiSectionText, { color: colors.textPrimary }]}>
                  Get AI Sleep Analysis
                </Text>
              </TouchableOpacity>
            ) : (
              <AnimatedCard style={styles.analysisCard} delay={100}>
                <View style={styles.analysisHeader}>
                  <Sparkles color={colors.sleep} size={20} />
                  <Text style={[styles.analysisTitle, { color: colors.textPrimary }]}>
                    Sleep Analysis
                  </Text>
                </View>

                {isLoadingSleep ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color={colors.sleep} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                      Analyzing your sleep patterns...
                    </Text>
                  </View>
                ) : sleepAnalysis ? (
                  <>
                    <Text style={[styles.patternText, { color: colors.textSecondary }]}>
                      {sleepAnalysis.pattern}
                    </Text>

                    <View style={styles.trendRow}>
                      <Text style={[styles.trendLabel, { color: colors.textSecondary }]}>
                        Quality Trend:
                      </Text>
                      <View
                        style={[
                          styles.trendBadge,
                          {
                            backgroundColor:
                              sleepAnalysis.qualityTrend === 'improving'
                                ? colors.success + '20'
                                : sleepAnalysis.qualityTrend === 'declining'
                                  ? colors.error + '20'
                                  : colors.info + '20',
                          },
                        ]}
                      >
                        {sleepAnalysis.qualityTrend === 'improving' && (
                          <TrendingUp color={colors.success} size={14} />
                        )}
                        {sleepAnalysis.qualityTrend === 'declining' && (
                          <TrendingDown color={colors.error} size={14} />
                        )}
                        {sleepAnalysis.qualityTrend === 'stable' && (
                          <Minus color={colors.info} size={14} />
                        )}
                        <Text
                          style={[
                            styles.trendText,
                            {
                              color:
                                sleepAnalysis.qualityTrend === 'improving'
                                  ? colors.success
                                  : sleepAnalysis.qualityTrend === 'declining'
                                    ? colors.error
                                    : colors.info,
                            },
                          ]}
                        >
                          {sleepAnalysis.qualityTrend.charAt(0).toUpperCase() +
                            sleepAnalysis.qualityTrend.slice(1)}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.bedtimeRec, { backgroundColor: colors.sleep + '10' }]}>
                      <Clock color={colors.sleep} size={16} />
                      <Text style={[styles.bedtimeText, { color: colors.textPrimary }]}>
                        Recommended bedtime: {sleepAnalysis.optimalBedtime}
                      </Text>
                    </View>

                    <Text style={[styles.recsTitle, { color: colors.textSecondary }]}>
                      Recommendations:
                    </Text>
                    {sleepAnalysis.recommendations.map((rec) => (
                      <View key={rec} style={styles.recItem}>
                        <Text style={[styles.recBullet, { color: colors.sleep }]}>•</Text>
                        <Text style={[styles.recText, { color: colors.textSecondary }]}>{rec}</Text>
                      </View>
                    ))}

                    <AnimatedButton
                      title="Refresh Analysis"
                      variant="secondary"
                      onPress={handleGetAnalysis}
                      loading={isLoadingSleep}
                      style={{ marginTop: spacing.md }}
                    />
                  </>
                ) : null}
              </AnimatedCard>
            )}
          </Animated.View>
        )}
      </ScrollView>

      <FAB
        color={colors.sleep}
        onPress={() => {
          setEditEntry(undefined);
          setModalVisible(true);
        }}
        icon={<Plus color={colors.white} size={24} />}
      />

      <SleepLogModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditEntry(undefined);
        }}
        editEntry={editEntry}
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
  entryCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  entryDate: {
    fontSize: 16,
    fontWeight: '600',
  },
  qualityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  qualityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  entryStats: {
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
  analysisCard: {
    padding: spacing.md,
    marginTop: spacing.md,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  analysisTitle: {
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
  patternText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  trendLabel: {
    fontSize: 14,
    marginRight: spacing.sm,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  trendText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  bedtimeRec: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  bedtimeText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: spacing.sm,
  },
  recsTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  recItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  recBullet: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  recText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
});
