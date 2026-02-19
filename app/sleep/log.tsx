import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Moon, Star, X } from 'lucide-react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, borderRadius } from '@/src/theme';
import { AnimatedCard, AnimatedButton } from '@/src/components/ui';
import { useSleepStore } from '@/src/store';
import { getDateString, getErrorMessage } from '@/src/utils/date';
import { ANIMATION_DURATION, SPRING_CONFIG, SCALE } from '@/src/utils/animations';

const SLEEP_FACTORS = ['Caffeine', 'Alcohol', 'Exercise', 'Screen time', 'Stress', 'Nap'];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function FactorChip({
  label,
  selected,
  onPress,
  color,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  color: string;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={() => {
        scale.value = withSpring(SCALE.quickActionPressIn, SPRING_CONFIG.pressIn);
        setTimeout(() => {
          scale.value = withSpring(1, SPRING_CONFIG.pressOut);
        }, ANIMATION_DURATION.pressRelease);
        onPress();
      }}
      style={[
        styles.factorChip,
        animatedStyle,
        { backgroundColor: selected ? color + '20' : colors.surfaceSecondary },
      ]}
    >
      <Text
        style={[
          styles.factorText,
          { color: selected ? color : colors.textSecondary, fontWeight: selected ? '600' : '400' },
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

export default function LogSleepScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { createEntry } = useSleepStore();

  const [bedtime, setBedtime] = useState(new Date(new Date().setHours(22, 0, 0, 0)));
  const [wakeTime, setWakeTime] = useState(new Date(new Date().setHours(7, 0, 0, 0)));
  const [quality, setQuality] = useState(3);
  const [notes, setNotes] = useState('');
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const calculateDuration = () => {
    let diff = wakeTime.getTime() - bedtime.getTime();
    if (diff < 0) diff += 24 * 60 * 60 * 1000;
    return Math.round(diff / 60000);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const toggleFactor = (factor: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFactors((prev) =>
      prev.includes(factor) ? prev.filter((f) => f !== factor) : [...prev, factor],
    );
  };

  const handleSave = async () => {
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await createEntry({
        date: getDateString(),
        bedtime: bedtime.toISOString(),
        wakeTime: wakeTime.toISOString(),
        durationMinutes: calculateDuration(),
        quality: quality as 1 | 2 | 3 | 4 | 5,
        notes: notes.trim() || undefined,
        factors: selectedFactors,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X color={colors.textSecondary} size={24} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Log Sleep</Text>
        <View style={styles.placeholder} />
      </View>

      <Animated.View entering={FadeInDown.duration(400).delay(100)}>
        <AnimatedCard style={styles.durationCard} delay={0}>
          <Moon color={colors.sleep} size={32} />
          <Text style={[styles.durationText, { color: colors.sleep }]}>
            {formatDuration(calculateDuration())}
          </Text>
          <Text style={[styles.durationLabel, { color: colors.textTertiary }]}>Total Sleep</Text>
        </AnimatedCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(150)} style={styles.timeSection}>
        <View style={styles.timeBlock}>
          <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>Bedtime</Text>
          <DateTimePicker
            value={bedtime}
            mode="time"
            display="spinner"
            onChange={(_, date) => date && setBedtime(date)}
            style={styles.timePicker}
            themeVariant={isDark ? 'dark' : 'light'}
          />
        </View>
        <View style={styles.timeBlock}>
          <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>Wake Time</Text>
          <DateTimePicker
            value={wakeTime}
            mode="time"
            display="spinner"
            onChange={(_, date) => date && setWakeTime(date)}
            style={styles.timePicker}
            themeVariant={isDark ? 'dark' : 'light'}
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(200)}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Sleep Quality</Text>
        <AnimatedCard style={styles.qualityCard} delay={100}>
          <View style={styles.qualityStars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setQuality(star);
                }}
              >
                <Star
                  color={star <= quality ? colors.warning : colors.textTertiary}
                  fill={star <= quality ? colors.warning : 'none'}
                  size={36}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.qualityText, { color: colors.textSecondary }]}>
            {quality === 1 && 'Poor'}
            {quality === 2 && 'Fair'}
            {quality === 3 && 'Good'}
            {quality === 4 && 'Very Good'}
            {quality === 5 && 'Excellent'}
          </Text>
        </AnimatedCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(250)}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Factors Affecting Sleep
        </Text>
        <View style={styles.factorsGrid}>
          {SLEEP_FACTORS.map((factor) => (
            <FactorChip
              key={factor}
              label={factor}
              selected={selectedFactors.includes(factor)}
              onPress={() => toggleFactor(factor)}
              color={colors.sleep}
            />
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(300)}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Notes</Text>
        <TextInput
          style={[
            styles.notesInput,
            { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary },
          ]}
          value={notes}
          onChangeText={setNotes}
          placeholder="How did you sleep? Any dreams?"
          placeholderTextColor={colors.textTertiary}
          multiline
          numberOfLines={3}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(350)}>
        <AnimatedButton
          title="Save Sleep Entry"
          onPress={handleSave}
          loading={saving}
          style={styles.saveButton}
          fullWidth
        />
      </Animated.View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingTop: spacing.md,
  },
  closeButton: {
    padding: spacing.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  placeholder: {
    width: 32,
  },
  durationCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.lg,
  },
  durationText: {
    fontSize: 48,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  durationLabel: {
    fontSize: 14,
    marginTop: spacing.xs,
  },
  timeSection: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  timeBlock: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  timePicker: {
    height: 120,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  qualityCard: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  qualityStars: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  qualityText: {
    fontSize: 15,
    marginTop: spacing.sm,
  },
  factorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  factorChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  factorText: {
    fontSize: 14,
  },
  notesInput: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: spacing.xl,
  },
});
