import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { Flame, Award, Crown, Zap, X, PartyPopper } from 'lucide-react-native';
import ReanimatedAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { spacing, typography, borderRadius, useTheme, type ThemeColors } from '@/src/theme';
import { Button } from '@/src/components/ui';
import { SPRING_CONFIG } from '@/src/utils/animations';

interface StreakCelebrationProps {
  visible: boolean;
  streak: number;
  habitName: string;
  onClose: () => void;
}

const MILESTONES = [7, 14, 21, 30, 60, 90, 100, 180, 365];

export function StreakCelebration({ visible, streak, habitName, onClose }: StreakCelebrationProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const scaleValue = useSharedValue(0);
  const rotateValue = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      scaleValue.value = withSpring(1, SPRING_CONFIG.celebration);
      rotateValue.value = withRepeat(
        withSequence(
          withTiming(5, { duration: 1000 }),
          withTiming(-5, { duration: 1000 }),
          withTiming(0, { duration: 1000 }),
        ),
        -1,
      );
    } else {
      scaleValue.value = 0;
      rotateValue.value = 0;
    }
  }, [visible, scaleValue, rotateValue]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }, { rotate: `${rotateValue.value}deg` }],
  }));

  const getStreakInfo = () => {
    if (streak >= 365)
      return {
        icon: Crown,
        color: colors.warning,
        title: 'LEGENDARY!',
        message: 'A full year of dedication!',
      };
    if (streak >= 100)
      return {
        icon: Award,
        color: colors.primary,
        title: 'INCREDIBLE!',
        message: '100 days strong!',
      };
    if (streak >= 30)
      return {
        icon: Zap,
        color: colors.success,
        title: 'ON FIRE!',
        message: '30 days of consistency!',
      };
    if (streak >= 7)
      return { icon: Flame, color: colors.error, title: 'AMAZING!', message: 'One week streak!' };
    return { icon: PartyPopper, color: colors.primary, title: 'NICE!', message: 'Keep it going!' };
  };

  const { icon: Icon, color, title, message } = getStreakInfo();
  const isMilestone = MILESTONES.includes(streak);

  if (!isMilestone) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <ReanimatedAnimated.View style={[styles.container, animatedStyle]}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.closeButton}>
              <Pressable onPress={onClose} hitSlop={20}>
                <X color={colors.textTertiary} size={24} />
              </Pressable>
            </View>

            <View style={[styles.iconCircle, { backgroundColor: color + '20' }]}>
              <Icon color={color} size={64} fill={color} />
            </View>

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            <View style={styles.streakContainer}>
              <Flame color={color} size={32} fill={color} />
              <Text style={[styles.streakNumber, { color }]}>{streak}</Text>
              <Text style={styles.streakLabel}>day streak</Text>
            </View>

            <Text style={styles.habitName}>{`"${habitName}"`}</Text>

            <Button title="Keep Going!" onPress={onClose} style={styles.button} />
          </Pressable>
        </ReanimatedAnimated.View>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    container: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.xl,
      padding: spacing.xl,
      alignItems: 'center',
      width: '100%',
      maxWidth: 320,
    },
    closeButton: {
      position: 'absolute',
      top: -spacing.md,
      right: -spacing.md,
    },
    iconCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    title: {
      ...typography.h1,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    message: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    streakContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    streakNumber: {
      fontSize: 48,
      fontWeight: '800',
    },
    streakLabel: {
      ...typography.body,
      color: colors.textSecondary,
    },
    habitName: {
      ...typography.bodySmall,
      color: colors.textTertiary,
      fontStyle: 'italic',
      marginBottom: spacing.lg,
    },
    button: {
      width: '100%',
    },
  });

export { MILESTONES };
