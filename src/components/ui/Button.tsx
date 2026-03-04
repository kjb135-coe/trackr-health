import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { spacing, borderRadius, useTheme, type ThemeColors } from '@/src/theme';
import { getButtonVariantStyle, getButtonTextColor, type ButtonVariant } from './buttonStyles';

type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  fullWidth = false,
}: ButtonProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled }}
      style={[
        styles.base,
        getButtonVariantStyle(variant, colors),
        styles[`size_${size}`],
        isDisabled && styles.disabled,
        fullWidth && styles.fullWidth,
        style,
      ]}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getButtonTextColor(variant, colors)} size="small" />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              { color: getButtonTextColor(variant, colors) },
              styles[`text_${size}`],
              icon ? { marginLeft: spacing.xs } : undefined,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    base: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.lg,
    },
    size_sm: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      minHeight: 36,
    },
    size_md: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      minHeight: 48,
    },
    size_lg: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      minHeight: 56,
    },
    disabled: {
      opacity: 0.5,
    },
    fullWidth: {
      width: '100%' as unknown as number,
    },
    text: {
      fontWeight: '600',
    },
    text_sm: {
      fontSize: 14,
    },
    text_md: {
      fontSize: 16,
    },
    text_lg: {
      fontSize: 18,
    },
  });
