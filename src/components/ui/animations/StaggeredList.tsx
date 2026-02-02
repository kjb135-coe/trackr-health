import React from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface StaggeredItemProps {
  children: React.ReactNode;
  index: number;
  staggerDelay?: number;
  style?: ViewStyle;
}

export function StaggeredItem({
  children,
  index,
  staggerDelay = 50,
  style,
}: StaggeredItemProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  const scale = useSharedValue(0.95);

  React.useEffect(() => {
    const delay = index * staggerDelay;
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 20, stiffness: 90 }));
    scale.value = withDelay(delay, withSpring(1, { damping: 20, stiffness: 90 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

interface StaggeredListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  staggerDelay?: number;
  style?: ViewStyle;
  itemStyle?: ViewStyle;
}

export function StaggeredList<T>({
  data,
  renderItem,
  keyExtractor,
  staggerDelay = 50,
  style,
  itemStyle,
}: StaggeredListProps<T>) {
  return (
    <Animated.View style={style}>
      {data.map((item, index) => (
        <StaggeredItem
          key={keyExtractor(item, index)}
          index={index}
          staggerDelay={staggerDelay}
          style={itemStyle}
        >
          {renderItem(item, index)}
        </StaggeredItem>
      ))}
    </Animated.View>
  );
}
