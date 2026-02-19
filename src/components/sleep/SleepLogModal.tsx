import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { X } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, borderRadius } from '@/src/theme';
import { AnimatedButton } from '@/src/components/ui';
import { useSleepStore } from '@/src/store';
import { getDateString, getDurationMinutes } from '@/src/utils/date';

interface SleepLogModalProps {
  visible: boolean;
  onClose: () => void;
}

function getQualityColor(q: number, colors: ReturnType<typeof useTheme>['colors']): string {
  switch (q) {
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
      return colors.textTertiary;
  }
}

export function SleepLogModal({ visible, onClose }: SleepLogModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [bedtimeHour, setBedtimeHour] = useState('22');
  const [bedtimeMin, setBedtimeMin] = useState('00');
  const [wakeHour, setWakeHour] = useState('07');
  const [wakeMin, setWakeMin] = useState('00');
  const [quality, setQuality] = useState<1 | 2 | 3 | 4 | 5>(3);

  const { createEntry } = useSleepStore();

  const handleCreateEntry = async () => {
    const bh = parseInt(bedtimeHour);
    const bm = parseInt(bedtimeMin);
    const wh = parseInt(wakeHour);
    const wm = parseInt(wakeMin);

    if (isNaN(bh) || bh < 0 || bh > 23 || isNaN(bm) || bm < 0 || bm > 59) {
      Alert.alert('Invalid bedtime', 'Hours must be 0-23 and minutes 0-59.');
      return;
    }
    if (isNaN(wh) || wh < 0 || wh > 23 || isNaN(wm) || wm < 0 || wm > 59) {
      Alert.alert('Invalid wake time', 'Hours must be 0-23 and minutes 0-59.');
      return;
    }

    const today = getDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Construct bedtime (yesterday) and wake time (today)
    const bedtime = new Date(yesterday);
    bedtime.setHours(bh, bm, 0, 0);

    const wakeTime = new Date();
    wakeTime.setHours(wh, wm, 0, 0);

    // If bedtime hour is less than wake hour, bedtime is same day
    if (bh < wh) {
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

    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
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
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Log Sleep</Text>
            <TouchableOpacity onPress={onClose}>
              <X color={colors.textPrimary} size={24} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Bedtime</Text>
          <View style={styles.timeRow}>
            <TextInput
              style={[
                styles.timeInput,
                { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary },
              ]}
              value={bedtimeHour}
              onChangeText={setBedtimeHour}
              keyboardType="number-pad"
              maxLength={2}
            />
            <Text style={[styles.timeSeparator, { color: colors.textPrimary }]}>:</Text>
            <TextInput
              style={[
                styles.timeInput,
                { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary },
              ]}
              value={bedtimeMin}
              onChangeText={setBedtimeMin}
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Wake Time</Text>
          <View style={styles.timeRow}>
            <TextInput
              style={[
                styles.timeInput,
                { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary },
              ]}
              value={wakeHour}
              onChangeText={setWakeHour}
              keyboardType="number-pad"
              maxLength={2}
            />
            <Text style={[styles.timeSeparator, { color: colors.textPrimary }]}>:</Text>
            <TextInput
              style={[
                styles.timeInput,
                { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary },
              ]}
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
                  quality === q && { backgroundColor: getQualityColor(q, colors) },
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
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
});
