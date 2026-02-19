import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { spacing, typography, borderRadius, useTheme, type ThemeColors } from '@/src/theme';
import { Button } from '@/src/components/ui';
import { useAuthStore } from '@/src/store';
import { ANIMATION_DURATION, STAGGER_DELAY } from '@/src/utils/animations';

export default function SignUpScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { signUp, isLoading } = useAuthStore();

  const handleSignUp = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      await signUp(email.trim(), password, name.trim());
      Alert.alert(
        'Verification Email Sent',
        'Please check your email and click the verification link to complete your registration.',
        [{ text: 'OK', onPress: () => router.push('/auth/verify-email') }],
      );
    } catch (err: unknown) {
      const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : '';
      Alert.alert('Sign Up Failed', getErrorMessage(code));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Animated.Text
            entering={FadeInDown.duration(ANIMATION_DURATION.screenEntrance).delay(
              STAGGER_DELAY.initialOffset,
            )}
            exiting={FadeOut.duration(ANIMATION_DURATION.exit)}
            style={styles.title}
          >
            Create Account
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.duration(ANIMATION_DURATION.screenEntrance).delay(
              STAGGER_DELAY.initialOffset + STAGGER_DELAY.listItem,
            )}
            exiting={FadeOut.duration(ANIMATION_DURATION.exit)}
            style={styles.subtitle}
          >
            Start your health tracking journey
          </Animated.Text>

          <Animated.View
            entering={FadeInDown.duration(ANIMATION_DURATION.screenEntrance).delay(
              STAGGER_DELAY.initialOffset + STAGGER_DELAY.section * 2,
            )}
            exiting={FadeOut.duration(ANIMATION_DURATION.exit)}
            style={styles.form}
          >
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor={colors.textTertiary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoComplete="name"
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor={colors.textTertiary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="new-password"
            />

            <Text style={styles.passwordHint}>Password must be at least 6 characters</Text>

            <Button
              title="Create Account"
              onPress={handleSignUp}
              loading={isLoading}
              style={styles.button}
            />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(ANIMATION_DURATION.screenEntrance).delay(
              STAGGER_DELAY.initialOffset + STAGGER_DELAY.section * 3,
            )}
            exiting={FadeOut.duration(ANIMATION_DURATION.exit)}
            style={styles.footer}
          >
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function getErrorMessage(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists';
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/weak-password':
      return 'Password is too weak';
    default:
      return 'An error occurred. Please try again.';
  }
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
    },
    content: {
      flex: 1,
      padding: spacing.lg,
      justifyContent: 'center',
    },
    title: {
      ...typography.h1,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.xl,
    },
    form: {
      marginBottom: spacing.xl,
    },
    input: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      fontSize: 16,
      color: colors.textPrimary,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    passwordHint: {
      ...typography.caption,
      color: colors.textTertiary,
      marginBottom: spacing.lg,
    },
    button: {
      marginTop: spacing.sm,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
    },
    footerText: {
      ...typography.body,
      color: colors.textSecondary,
    },
    footerLink: {
      ...typography.body,
      color: colors.primary,
      fontWeight: '600',
    },
  });
