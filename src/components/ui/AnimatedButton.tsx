import React from 'react';
import {
  Text,
  ActivityIndicator,
  Pressable,
  StyleProp,
  ViewStyle,
  StyleSheet,
  DimensionValue,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, borderRadius } from '@/src/theme';
import { SPRING_CONFIG, SCALE } from '@/src/utils/animations';
import { getButtonVariantStyle, getButtonTextColor, type ButtonVariant } from './buttonStyles';

type ButtonSize = 'sm' | 'md' | 'lg';

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  haptic?: boolean;
  fullWidth?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AnimatedButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  haptic = true,
  fullWidth = false,
}: AnimatedButtonProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const isDisabled = disabled || loading;

  const handlePressIn = () => {
    if (!isDisabled) {
      scale.value = withSpring(SCALE.buttonPressIn, SPRING_CONFIG.pressIn);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SPRING_CONFIG.pressOut);
  };

  const handlePress = () => {
    if (isDisabled) return;

    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Bounce animation on press
    scale.value = withSequence(
      withSpring(SCALE.buttonBounce, SPRING_CONFIG.pressIn),
      withSpring(1, SPRING_CONFIG.bounce),
    );

    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled }}
      style={[
        styles.base,
        styles[size],
        getButtonVariantStyle(variant, colors),
        isDisabled && styles.disabled,
        fullWidth && styles.fullWidth,
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getButtonTextColor(variant, colors)} size="small" />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              { color: getButtonTextColor(variant, colors), fontSize: textSizes[size] },
              icon ? styles.textWithIcon : undefined,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </AnimatedPressable>
  );
}

const textSizes: Record<ButtonSize, number> = {
  sm: 14,
  md: 16,
  lg: 18,
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  sm: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    minHeight: 36,
  },
  md: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
  },
  lg: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minHeight: 56,
  },
  disabled: {
    opacity: 0.5,
  },
  fullWidth: {
    width: '100%' as DimensionValue,
  },
  text: {
    fontWeight: '600',
  },
  textWithIcon: {
    marginLeft: spacing.xs,
  },
});
