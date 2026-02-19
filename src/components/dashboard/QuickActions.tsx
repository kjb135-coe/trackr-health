import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Moon, Dumbbell, Camera, PenLine } from 'lucide-react-native';
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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface QuickActionButtonProps {
  label: string;
  Icon: typeof Moon;
  color: string;
  onPress: () => void;
}

function QuickActionButton({ label, Icon, color, onPress }: QuickActionButtonProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(SCALE.quickActionPressIn, SPRING_CONFIG.pressIn);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SPRING_CONFIG.pressOut);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSequence(
      withSpring(SCALE.quickActionBounce, SPRING_CONFIG.pressIn),
      withSpring(1, SPRING_CONFIG.bounce),
    );
    onPress();
  };

  return (
    <AnimatedPressable
      style={[styles.actionButton, animatedStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Icon color={color} size={24} />
      </View>
      <Text style={[styles.actionLabel, { color: colors.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

export function QuickActions() {
  const router = useRouter();
  const { colors } = useTheme();

  const actions = [
    {
      label: 'Log Sleep',
      Icon: Moon,
      color: colors.sleep,
      route: '/sleep/log',
    },
    {
      label: 'Workout',
      Icon: Dumbbell,
      color: colors.exercise,
      route: '/exercise/log',
    },
    {
      label: 'Scan Food',
      Icon: Camera,
      color: colors.nutrition,
      route: '/nutrition/camera',
    },
    {
      label: 'Journal',
      Icon: PenLine,
      color: colors.journal,
      route: '/journal/new',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Quick Actions</Text>
      <View style={[styles.actionsContainer, { backgroundColor: colors.surface }]}>
        {actions.map((action) => (
          <QuickActionButton
            key={action.route}
            label={action.label}
            Icon={action.Icon}
            color={action.color}
            onPress={() => router.push(action.route as Href)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});
