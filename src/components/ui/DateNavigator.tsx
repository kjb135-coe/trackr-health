import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { addDays, subDays, parseISO, isToday } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, borderRadius } from '@/src/theme';
import { getDateString, getRelativeDateLabel } from '@/src/utils/date';

interface DateNavigatorProps {
  date: string;
  onDateChange: (date: string) => void;
}

export function DateNavigator({ date, onDateChange }: DateNavigatorProps) {
  const { colors } = useTheme();
  const parsed = parseISO(date);
  const isCurrentDay = isToday(parsed);

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDateChange(getDateString(subDays(parsed, 1)));
  };

  const goForward = () => {
    if (isCurrentDay) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDateChange(getDateString(addDays(parsed, 1)));
  };

  const goToday = () => {
    if (isCurrentDay) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDateChange(getDateString());
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceSecondary }]}>
      <TouchableOpacity onPress={goBack} style={styles.arrow} testID="date-nav-back">
        <ChevronLeft color={colors.textPrimary} size={20} />
      </TouchableOpacity>
      <TouchableOpacity onPress={goToday} style={styles.labelContainer}>
        <Text style={[styles.label, { color: colors.textPrimary }]}>
          {getRelativeDateLabel(date)}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={goForward}
        style={styles.arrow}
        disabled={isCurrentDay}
        testID="date-nav-forward"
      >
        <ChevronRight color={isCurrentDay ? colors.textTertiary : colors.textPrimary} size={20} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  arrow: {
    padding: spacing.xs,
  },
  labelContainer: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
});
