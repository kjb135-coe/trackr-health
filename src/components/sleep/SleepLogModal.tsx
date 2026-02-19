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
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, borderRadius } from '@/src/theme';
import { AnimatedButton, ModalHeader } from '@/src/components/ui';
import { useSleepStore } from '@/src/store';
import { parseISO } from 'date-fns';
import { getDateString, getDurationMinutes, getErrorMessage } from '@/src/utils/date';
import { getQualityColor } from '@/src/utils/constants';
import { SleepEntry } from '@/src/types';

interface SleepLogModalProps {
  visible: boolean;
  onClose: () => void;
  editEntry?: SleepEntry;
  date?: string;
}

export function SleepLogModal({ visible, onClose, editEntry, date }: SleepLogModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const getInitialValues = () => {
    if (editEntry) {
      const bed = new Date(editEntry.bedtime);
      const wake = new Date(editEntry.wakeTime);
      return {
        bh: bed.getHours().toString().padStart(2, '0'),
        bm: bed.getMinutes().toString().padStart(2, '0'),
        wh: wake.getHours().toString().padStart(2, '0'),
        wm: wake.getMinutes().toString().padStart(2, '0'),
        q: editEntry.quality,
      };
    }
    return { bh: '22', bm: '00', wh: '07', wm: '00', q: 3 as const };
  };

  const initial = getInitialValues();
  const [bedtimeHour, setBedtimeHour] = useState(initial.bh);
  const [bedtimeMin, setBedtimeMin] = useState(initial.bm);
  const [wakeHour, setWakeHour] = useState(initial.wh);
  const [wakeMin, setWakeMin] = useState(initial.wm);
  const [quality, setQuality] = useState<1 | 2 | 3 | 4 | 5>(initial.q);
  const [saving, setSaving] = useState(false);

  // Reset form when editEntry changes
  React.useEffect(() => {
    const vals = getInitialValues();
    setBedtimeHour(vals.bh);
    setBedtimeMin(vals.bm);
    setWakeHour(vals.wh);
    setWakeMin(vals.wm);
    setQuality(vals.q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editEntry]);

  const { createEntry, updateEntry } = useSleepStore();

  const handleCreateEntry = async () => {
    const bh = parseInt(bedtimeHour, 10);
    const bm = parseInt(bedtimeMin, 10);
    const wh = parseInt(wakeHour, 10);
    const wm = parseInt(wakeMin, 10);

    if (isNaN(bh) || bh < 0 || bh > 23 || isNaN(bm) || bm < 0 || bm > 59) {
      Alert.alert('Invalid bedtime', 'Hours must be 0-23 and minutes 0-59.');
      return;
    }
    if (isNaN(wh) || wh < 0 || wh > 23 || isNaN(wm) || wm < 0 || wm > 59) {
      Alert.alert('Invalid wake time', 'Hours must be 0-23 and minutes 0-59.');
      return;
    }

    const entryDate = date || getDateString();

    // Use the entry's date when editing, selected date when creating, otherwise today
    const wakeDate = editEntry ? parseISO(editEntry.date) : parseISO(entryDate);
    const prevDay = new Date(wakeDate);
    prevDay.setDate(prevDay.getDate() - 1);

    // Construct bedtime (day before) and wake time (entry date)
    const bedtime = new Date(prevDay);
    bedtime.setHours(bh, bm, 0, 0);

    const wakeTime = new Date(wakeDate);
    wakeTime.setHours(wh, wm, 0, 0);

    // If bedtime hour is less than wake hour, bedtime is same day as wake
    if (bh < wh) {
      bedtime.setDate(bedtime.getDate() + 1);
    }

    const durationMinutes = getDurationMinutes(bedtime, wakeTime);

    setSaving(true);
    try {
      if (editEntry) {
        await updateEntry(editEntry.id, {
          bedtime: bedtime.toISOString(),
          wakeTime: wakeTime.toISOString(),
          durationMinutes,
          quality,
        });
      } else {
        await createEntry({
          date: entryDate,
          bedtime: bedtime.toISOString(),
          wakeTime: wakeTime.toISOString(),
          durationMinutes,
          quality,
        });
      }

      onClose();
    } catch (error) {
      Alert.alert('Save failed', getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
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
          <ModalHeader title={editEntry ? 'Edit Sleep' : 'Log Sleep'} onClose={onClose} />

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Bedtime</Text>
          <View style={styles.timeRow}>
            <TextInput
              accessibilityLabel="Bedtime hour"
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
              accessibilityLabel="Bedtime minute"
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
              accessibilityLabel="Wake time hour"
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
              accessibilityLabel="Wake time minute"
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
                    quality === q && { color: colors.white },
                  ]}
                >
                  {q}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <AnimatedButton
            title={editEntry ? 'Update Sleep Entry' : 'Save Sleep Entry'}
            onPress={handleCreateEntry}
            loading={saving}
            fullWidth
          />
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
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
