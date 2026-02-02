import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Plus, Moon, X, Sparkles, TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, borderRadius } from '@/src/theme';
import { AnimatedCard, AnimatedButton } from '@/src/components/ui';
import { useSleepStore, useAIInsightsStore } from '@/src/store';
import { getDateString, formatDuration, formatTime, getRelativeDateLabel, getDurationMinutes } from '@/src/utils/date';
import { QUALITY_LABELS } from '@/src/utils/constants';
import { SleepEntry } from '@/src/types';
import { hasApiKey } from '@/src/services/claude';

export default function SleepScreen() {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [bedtimeHour, setBedtimeHour] = useState('22');
  const [bedtimeMin, setBedtimeMin] = useState('00');
  const [wakeHour, setWakeHour] = useState('07');
  const [wakeMin, setWakeMin] = useState('00');
  const [quality, setQuality] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [apiKeyExists, setApiKeyExists] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const { entries, isLoading, loadEntries, createEntry } = useSleepStore();
  const { sleepAnalysis, isLoadingSleep, fetchSleepAnalysis } = useAIInsightsStore();

  const getQualityColor = (q: number): string => {
    switch (q) {
      case 1: return colors.error;
      case 2: return colors.warning;
      case 3: return colors.info;
      case 4: return colors.success;
      case 5: return colors.sleep;
      default: return colors.textTertiary;
    }
  };

  useEffect(() => {
    loadEntries();
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    const exists = await hasApiKey();
    setApiKeyExists(exists);
  };

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

  const handleCreateEntry = async () => {
    const today = getDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Construct bedtime (yesterday) and wake time (today)
    const bedtime = new Date(yesterday);
    bedtime.setHours(parseInt(bedtimeHour), parseInt(bedtimeMin), 0, 0);

    const wakeTime = new Date();
    wakeTime.setHours(parseInt(wakeHour), parseInt(wakeMin), 0, 0);

    // If bedtime hour is less than wake hour, bedtime is same day
    if (parseInt(bedtimeHour) < parseInt(wakeHour)) {
      bedtime.setDate(bedtime.getDate() + 1);
    }

    const durationMinutes = getDurationMinutes(bedtime, wakeTime);

    await createEntry({
      date: today,
      bedtime: bedtime.toISOString(),
      wakeTime: wakeTime.toISOString(),
      durationMinutes,
      quality,
    });

    setModalVisible(false);
  };

  const recentEntries = entries.slice(0, 7);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Sleep</Text>
        </Animated.View>

        {recentEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <Moon color={colors.sleep} size={48} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No sleep data yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>Tap + to log your sleep</Text>
          </View>
        ) : (
          recentEntries.map((entry, index) => (
            <Animated.View key={entry.id} entering={FadeInDown.duration(400).delay(index * 50)}>
              <AnimatedCard style={styles.entryCard} delay={index * 50}>
                <View style={styles.entryHeader}>
                  <Text style={[styles.entryDate, { color: colors.textPrimary }]}>{getRelativeDateLabel(entry.date)}</Text>
                  <View style={[styles.qualityBadge, { backgroundColor: getQualityColor(entry.quality) }]}>
                    <Text style={styles.qualityText}>{QUALITY_LABELS[entry.quality]}</Text>
                  </View>
                </View>

                <View style={styles.entryStats}>
                  <View style={styles.stat}>
                    <Text style={[styles.statValue, { color: colors.textPrimary }]}>{formatDuration(entry.durationMinutes)}</Text>
                    <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Duration</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={[styles.statValue, { color: colors.textPrimary }]}>{formatTime(entry.bedtime)}</Text>
                    <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Bedtime</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={[styles.statValue, { color: colors.textPrimary }]}>{formatTime(entry.wakeTime)}</Text>
                    <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Wake</Text>
                  </View>
                </View>
              </AnimatedCard>
            </Animated.View>
          ))
        )}

        {/* AI Sleep Analysis */}
        {apiKeyExists && entries.length >= 3 && (
          <Animated.View entering={FadeInDown.duration(400).delay(200)}>
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
                      <View style={[
                        styles.trendBadge,
                        {
                          backgroundColor: sleepAnalysis.qualityTrend === 'improving'
                            ? colors.success + '20'
                            : sleepAnalysis.qualityTrend === 'declining'
                            ? colors.error + '20'
                            : colors.info + '20'
                        }
                      ]}>
                        {sleepAnalysis.qualityTrend === 'improving' && (
                          <TrendingUp color={colors.success} size={14} />
                        )}
                        {sleepAnalysis.qualityTrend === 'declining' && (
                          <TrendingDown color={colors.error} size={14} />
                        )}
                        {sleepAnalysis.qualityTrend === 'stable' && (
                          <Minus color={colors.info} size={14} />
                        )}
                        <Text style={[
                          styles.trendText,
                          {
                            color: sleepAnalysis.qualityTrend === 'improving'
                              ? colors.success
                              : sleepAnalysis.qualityTrend === 'declining'
                              ? colors.error
                              : colors.info
                          }
                        ]}>
                          {sleepAnalysis.qualityTrend.charAt(0).toUpperCase() + sleepAnalysis.qualityTrend.slice(1)}
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
                    {sleepAnalysis.recommendations.map((rec, index) => (
                      <View key={index} style={styles.recItem}>
                        <Text style={[styles.recBullet, { color: colors.sleep }]}>•</Text>
                        <Text style={[styles.recText, { color: colors.textSecondary }]}>
                          {rec}
                        </Text>
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

      {/* FAB */}
      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.sleep }]} onPress={() => setModalVisible(true)}>
        <Plus color="#FFFFFF" size={24} />
      </TouchableOpacity>

      {/* Log Sleep Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInDown.duration(300)} style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Log Sleep</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={colors.textPrimary} size={24} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Bedtime</Text>
            <View style={styles.timeRow}>
              <TextInput
                style={[styles.timeInput, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary }]}
                value={bedtimeHour}
                onChangeText={setBedtimeHour}
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text style={[styles.timeSeparator, { color: colors.textPrimary }]}>:</Text>
              <TextInput
                style={[styles.timeInput, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary }]}
                value={bedtimeMin}
                onChangeText={setBedtimeMin}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Wake Time</Text>
            <View style={styles.timeRow}>
              <TextInput
                style={[styles.timeInput, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary }]}
                value={wakeHour}
                onChangeText={setWakeHour}
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text style={[styles.timeSeparator, { color: colors.textPrimary }]}>:</Text>
              <TextInput
                style={[styles.timeInput, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary }]}
                value={wakeMin}
                onChangeText={setWakeMin}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Sleep Quality</Text>
            <View style={styles.qualityRow}>
              {([1, 2, 3, 4, 5] as const).map((q) => (
                <TouchableOpacity
                  key={q}
                  style={[
                    styles.qualityOption,
                    { backgroundColor: colors.surfaceSecondary },
                    quality === q && { backgroundColor: getQualityColor(q) },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setQuality(q);
                  }}
                >
                  <Text
                    style={[
                      styles.qualityOptionText,
                      { color: colors.textSecondary },
                      quality === q && { color: '#FFFFFF' },
                    ]}
                  >
                    {q}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <AnimatedButton title="Save Sleep Entry" onPress={handleCreateEntry} fullWidth />
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
    color: '#FFFFFF',
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
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  timeInput: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 24,
    fontWeight: '600',
    width: 70,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: '600',
    marginHorizontal: spacing.sm,
  },
  qualityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  qualityOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qualityOptionText: {
    fontSize: 16,
    fontWeight: '600',
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
