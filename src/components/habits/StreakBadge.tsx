import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Flame, Award, Crown, Zap } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '@/src/theme';

interface StreakBadgeProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
}

export function StreakBadge({ streak, size = 'md' }: StreakBadgeProps) {
  const getStreakInfo = () => {
    if (streak >= 365) return { icon: Crown, color: colors.warning, label: 'Legendary' };
    if (streak >= 100) return { icon: Award, color: colors.primary, label: 'Champion' };
    if (streak >= 30) return { icon: Zap, color: colors.success, label: 'On Fire' };
    if (streak >= 7) return { icon: Flame, color: colors.error, label: 'Hot' };
    return { icon: Flame, color: colors.gray400, label: '' };
  };

  const { icon: Icon, color, label } = getStreakInfo();
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 24 : 18;

  if (streak === 0) return null;

  return (
    <View style={[styles.container, styles[size]]}>
      <Icon color={color} size={iconSize} fill={streak >= 7 ? color : 'none'} />
      <Text style={[styles.streakText, styles[`text_${size}`], { color }]}>
        {streak}
      </Text>
      {label && size === 'lg' && (
        <Text style={[styles.label, { color }]}>{label}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sm: {
    padding: 2,
  },
  md: {
    padding: spacing.xs,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
  },
  lg: {
    padding: spacing.sm,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  streakText: {
    fontWeight: '700',
  },
  text_sm: {
    fontSize: 12,
  },
  text_md: {
    fontSize: 14,
  },
  text_lg: {
    fontSize: 18,
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
});
