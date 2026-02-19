import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { Mail } from 'lucide-react-native';
import { spacing, typography, useTheme, type ThemeColors } from '@/src/theme';
import { Button } from '@/src/components/ui';
import { useAuthStore } from '@/src/store';
import { ANIMATION_DURATION, STAGGER_DELAY } from '@/src/utils/animations';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [checking, setChecking] = useState(false);

  const { user, sendVerificationEmail, reloadUser, signOut, isLoading } = useAuthStore();

  useEffect(() => {
    const interval = setInterval(async () => {
      await reloadUser();
    }, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user?.emailVerified) {
      router.replace('/(tabs)');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.emailVerified]);

  const handleResend = async () => {
    try {
      await sendVerificationEmail();
      Alert.alert('Email Sent', 'A new verification email has been sent.');
    } catch {
      Alert.alert('Error', 'Could not send verification email. Please try again later.');
    }
  };

  const handleCheckVerification = async () => {
    setChecking(true);
    await reloadUser();
    setChecking(false);

    if (!user?.emailVerified) {
      Alert.alert('Not Verified', 'Your email has not been verified yet. Please check your inbox.');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/auth/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          entering={FadeInDown.duration(ANIMATION_DURATION.screenEntrance).delay(
            STAGGER_DELAY.initialOffset,
          )}
          exiting={FadeOut.duration(ANIMATION_DURATION.exit)}
          style={styles.iconContainer}
        >
          <Mail color={colors.primary} size={64} />
        </Animated.View>

        <Animated.Text
          entering={FadeInDown.duration(ANIMATION_DURATION.screenEntrance).delay(
            STAGGER_DELAY.initialOffset + STAGGER_DELAY.listItem,
          )}
          exiting={FadeOut.duration(ANIMATION_DURATION.exit)}
          style={styles.title}
        >
          Verify Your Email
        </Animated.Text>
        <Animated.Text
          entering={FadeInDown.duration(ANIMATION_DURATION.screenEntrance).delay(
            STAGGER_DELAY.initialOffset + STAGGER_DELAY.listItem * 2,
          )}
          exiting={FadeOut.duration(ANIMATION_DURATION.exit)}
          style={styles.subtitle}
        >
          {"We've sent a verification email to"}
          {'\n'}
          <Text style={styles.email}>{user?.email}</Text>
        </Animated.Text>

        <Animated.Text
          entering={FadeInDown.duration(ANIMATION_DURATION.screenEntrance).delay(
            STAGGER_DELAY.initialOffset + STAGGER_DELAY.section * 2,
          )}
          exiting={FadeOut.duration(ANIMATION_DURATION.exit)}
          style={styles.instructions}
        >
          {
            "Please click the link in the email to verify your account. If you don't see the email, check your spam folder."
          }
        </Animated.Text>

        <Animated.View
          entering={FadeInDown.duration(ANIMATION_DURATION.screenEntrance).delay(
            STAGGER_DELAY.initialOffset + STAGGER_DELAY.section * 3,
          )}
          exiting={FadeOut.duration(ANIMATION_DURATION.exit)}
          style={styles.buttons}
        >
          <Button
            title="I've Verified My Email"
            onPress={handleCheckVerification}
            loading={checking}
            style={styles.button}
          />

          <Button
            title="Resend Verification Email"
            onPress={handleResend}
            variant="secondary"
            loading={isLoading}
            style={styles.button}
          />

          <Button title="Sign Out" onPress={handleSignOut} variant="ghost" style={styles.button} />
        </Animated.View>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      padding: spacing.lg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xl,
    },
    title: {
      ...typography.h1,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    email: {
      color: colors.primary,
      fontWeight: '600',
    },
    instructions: {
      ...typography.bodySmall,
      color: colors.textTertiary,
      textAlign: 'center',
      marginBottom: spacing.xl,
      paddingHorizontal: spacing.md,
    },
    buttons: {
      width: '100%',
    },
    button: {
      marginBottom: spacing.md,
    },
  });
