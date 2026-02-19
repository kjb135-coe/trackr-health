import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, borderRadius } from '@/src/theme';

interface ErrorBannerProps {
  error: string;
  onDismiss: () => void;
}

export function ErrorBanner({ error, onDismiss }: ErrorBannerProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.banner, { backgroundColor: colors.error + '15' }]}
      onPress={onDismiss}
    >
      <Text style={[styles.text, { color: colors.error }]}>{error}</Text>
      <X color={colors.error} size={16} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  text: {
    fontSize: 14,
    flex: 1,
    marginRight: spacing.sm,
  },
});
