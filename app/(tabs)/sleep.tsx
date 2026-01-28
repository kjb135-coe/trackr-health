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
} from 'react-native';
import { Plus, Moon, X } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '@/src/theme';
import { Card, Button } from '@/src/components/ui';
import { useSleepStore } from '@/src/store';
import { getDateString, formatDuration, formatTime, getRelativeDateLabel, getDurationMinutes } from '@/src/utils/date';
import { QUALITY_LABELS } from '@/src/utils/constants';
import { SleepEntry } from '@/src/types';

export default function SleepScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [bedtimeHour, setBedtimeHour] = useState('22');
  const [bedtimeMin, setBedtimeMin] = useState('00');
  const [wakeHour, setWakeHour] = useState('07');
  const [wakeMin, setWakeMin] = useState('00');
  const [quality, setQuality] = useState<1 | 2 | 3 | 4 | 5>(3);

  const { entries, isLoading, loadEntries, createEntry } = useSleepStore();

  useEffect(() => {
    loadEntries();
  }, []);

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
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.sectionTitle}>Recent Sleep</Text>

        {recentEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <Moon color={colors.sleep} size={48} />
            <Text style={styles.emptyText}>No sleep data yet</Text>
            <Text style={styles.emptySubtext}>Tap + to log your sleep</Text>
          </View>
        ) : (
          recentEntries.map((entry) => (
            <Card key={entry.id} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryDate}>{getRelativeDateLabel(entry.date)}</Text>
                <View style={[styles.qualityBadge, { backgroundColor: getQualityColor(entry.quality) }]}>
                  <Text style={styles.qualityText}>{QUALITY_LABELS[entry.quality]}</Text>
                </View>
              </View>

              <View style={styles.entryStats}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{formatDuration(entry.durationMinutes)}</Text>
                  <Text style={styles.statLabel}>Duration</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{formatTime(entry.bedtime)}</Text>
                  <Text style={styles.statLabel}>Bedtime</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{formatTime(entry.wakeTime)}</Text>
                  <Text style={styles.statLabel}>Wake</Text>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Plus color={colors.white} size={24} />
      </TouchableOpacity>

      {/* Log Sleep Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Sleep</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={colors.textPrimary} size={24} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Bedtime</Text>
            <View style={styles.timeRow}>
              <TextInput
                style={styles.timeInput}
                value={bedtimeHour}
                onChangeText={setBedtimeHour}
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text style={styles.timeSeparator}>:</Text>
              <TextInput
                style={styles.timeInput}
                value={bedtimeMin}
                onChangeText={setBedtimeMin}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>

            <Text style={styles.inputLabel}>Wake Time</Text>
            <View style={styles.timeRow}>
              <TextInput
                style={styles.timeInput}
                value={wakeHour}
                onChangeText={setWakeHour}
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text style={styles.timeSeparator}>:</Text>
              <TextInput
                style={styles.timeInput}
                value={wakeMin}
                onChangeText={setWakeMin}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>

            <Text style={styles.inputLabel}>Sleep Quality</Text>
            <View style={styles.qualityRow}>
              {([1, 2, 3, 4, 5] as const).map((q) => (
                <TouchableOpacity
                  key={q}
                  style={[
                    styles.qualityOption,
                    quality === q && { backgroundColor: getQualityColor(q) },
                  ]}
                  onPress={() => setQuality(q)}
                >
                  <Text
                    style={[
                      styles.qualityOptionText,
                      quality === q && { color: colors.white },
                    ]}
                  >
                    {q}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button title="Save Sleep Entry" onPress={handleCreateEntry} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function getQualityColor(quality: number): string {
  switch (quality) {
    case 1:
      return colors.error;
    case 2:
      return colors.warning;
    case 3:
      return colors.info;
    case 4:
      return colors.success;
    case 5:
      return colors.sleep;
    default:
      return colors.gray400;
  }
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
  sectionTitle: {
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
    marginTop: spacing.md,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textTertiary,
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
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  qualityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  qualityText: {
    ...typography.caption,
    color: colors.white,
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
    ...typography.h4,
    color: colors.textPrimary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.sleep,
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
  inputLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  timeInput: {
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 24,
    fontWeight: '600',
    color: colors.textPrimary,
    width: 70,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.textPrimary,
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
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qualityOptionText: {
    ...typography.h4,
    color: colors.textSecondary,
  },
});
