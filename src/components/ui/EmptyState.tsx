import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing } from '@/src/theme';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  subtitle: string;
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {icon}
      <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.textTertiary }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  subtitle: {
    fontSize: 14,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
