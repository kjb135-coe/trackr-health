import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';

interface ScaleInProps {
  children: React.ReactNode;
  delay?: number;
  initialScale?: number;
  style?: ViewStyle;
}

export function ScaleIn({
  children,
  delay = 0,
  initialScale = 0.8,
  style,
}: ScaleInProps) {
  const scale = useSharedValue(initialScale);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 12, stiffness: 100 })
    );
    opacity.value = withDelay(
      delay,
      withSpring(1, { damping: 20, stiffness: 100 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}
