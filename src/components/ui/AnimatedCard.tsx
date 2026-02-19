import React from 'react';
import { ViewStyle, Pressable, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
  FadeOut,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, borderRadius } from '@/src/theme';
import { ANIMATION_DURATION, STAGGER_DELAY, SPRING_CONFIG, SCALE } from '@/src/utils/animations';

type CardVariant = 'elevated' | 'outlined' | 'filled';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface AnimatedCardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  haptic?: boolean;
  delay?: number;
  accessibilityLabel?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AnimatedCard({
  children,
  variant = 'elevated',
  padding = 'md',
  onPress,
  onLongPress,
  style,
  haptic = true,
  delay = 0,
  accessibilityLabel,
}: AnimatedCardProps) {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(SCALE.cardPressIn, SPRING_CONFIG.pressIn);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SPRING_CONFIG.pressOut);
  };

  const handlePress = () => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const paddingMap = {
    none: 0,
    sm: spacing.sm,
    md: spacing.md,
    lg: spacing.lg,
  };

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors.surface,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 8,
          elevation: 3,
        };
      case 'outlined':
        return {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'filled':
        return {
          backgroundColor: colors.surfaceSecondary,
        };
      default:
        return {};
    }
  };

  const cardStyle: ViewStyle = {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    padding: paddingMap[padding],
    ...getVariantStyle(),
  };

  const entering = FadeInDown.duration(ANIMATION_DURATION.cardEntrance)
    .delay(STAGGER_DELAY.initialOffset + delay)
    .springify();

  const exiting = FadeOut.duration(ANIMATION_DURATION.exit);

  if (onPress || onLongPress) {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        entering={entering}
        exiting={exiting}
        style={[cardStyle, animatedStyle, style]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <Animated.View entering={entering} exiting={exiting} style={[cardStyle, animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}
