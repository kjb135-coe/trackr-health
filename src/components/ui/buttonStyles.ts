import { ViewStyle } from 'react-native';
import type { ThemeColors } from '@/src/theme/ThemeContext';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function getButtonVariantStyle(variant: ButtonVariant, colors: ThemeColors): ViewStyle {
  switch (variant) {
    case 'primary':
      return { backgroundColor: colors.primary };
    case 'secondary':
      return {
        backgroundColor: colors.surfaceSecondary,
        borderWidth: 1,
        borderColor: colors.border,
      };
    case 'ghost':
      return { backgroundColor: 'transparent' };
    case 'danger':
      return { backgroundColor: colors.error };
    default:
      return {};
  }
}

export function getButtonTextColor(variant: ButtonVariant, colors: ThemeColors): string {
  switch (variant) {
    case 'primary':
    case 'danger':
      return colors.white;
    case 'secondary':
      return colors.textPrimary;
    case 'ghost':
      return colors.primary;
    default:
      return colors.textPrimary;
  }
}
