import React from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { spacing, borderRadius, typography, useTheme, type ThemeColors } from '@/src/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, containerStyle, style, ...props }: InputProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={containerStyle}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        accessibilityLabel={label || props.placeholder}
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor={colors.textTertiary}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    label: {
      ...typography.caption,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
      fontWeight: '500',
    },
    input: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: 16,
      color: colors.textPrimary,
      borderWidth: 1,
      borderColor: colors.borderLight,
      minHeight: 44,
    },
    inputError: {
      borderColor: colors.error,
    },
    error: {
      ...typography.caption,
      color: colors.error,
      marginTop: spacing.xs,
    },
  });
