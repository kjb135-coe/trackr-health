import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { spacing, typography, borderRadius, useTheme, type ThemeColors } from '@/src/theme';
import { Button } from '@/src/components/ui';
import { useAuthStore } from '@/src/store';
import { useGoogleAuth, getAuthErrorMessage } from '@/src/services/auth';
import { ANIMATION_DURATION, STAGGER_DELAY } from '@/src/utils/animations';

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { signIn, signInWithGoogle, isLoading } = useAuthStore();
  const { request, response, promptAsync } = useGoogleAuth();

  useEffect(() => {
    if (response && 'type' in response && response.type === 'success' && 'params' in response) {
      const params = response.params as { id_token?: string };
      if (params.id_token) {
        signInWithGoogle(params.id_token).catch((err: unknown) => {
          Alert.alert('Error', getAuthErrorMessage(err));
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      await signIn(email.trim(), password);
    } catch (err: unknown) {
      Alert.alert('Login Failed', getAuthErrorMessage(err));
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await promptAsync();
    } catch (err: unknown) {
      Alert.alert('Error', getAuthErrorMessage(err));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.Text
          entering={FadeInDown.duration(ANIMATION_DURATION.screenEntrance).delay(
            STAGGER_DELAY.initialOffset,
          )}
          exiting={FadeOut.duration(ANIMATION_DURATION.exit)}
          style={styles.title}
        >
          Welcome Back
        </Animated.Text>
        <Animated.Text
          entering={FadeInDown.duration(ANIMATION_DURATION.screenEntrance).delay(
            STAGGER_DELAY.initialOffset + STAGGER_DELAY.listItem,
          )}
          exiting={FadeOut.duration(ANIMATION_DURATION.exit)}
          style={styles.subtitle}
        >
          Sign in to continue tracking your health
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
            autoComplete="password"
          />

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => router.push('/auth/forgot-password')}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button title="Sign In" onPress={handleLogin} loading={isLoading} style={styles.button} />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleLogin}
            disabled={!request}
          >
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(ANIMATION_DURATION.screenEntrance).delay(
            STAGGER_DELAY.initialOffset + STAGGER_DELAY.section * 3,
          )}
          exiting={FadeOut.duration(ANIMATION_DURATION.exit)}
          style={styles.footer}
        >
          <Text style={styles.footerText}>{"Don't have an account? "}</Text>
          <TouchableOpacity onPress={() => router.push('/auth/signup')}>
            <Text style={styles.footerLink}>Sign Up</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
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
    forgotPassword: {
      alignSelf: 'flex-end',
      marginBottom: spacing.lg,
    },
    forgotPasswordText: {
      ...typography.bodySmall,
      color: colors.primary,
    },
    button: {
      marginBottom: spacing.md,
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: spacing.lg,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.borderLight,
    },
    dividerText: {
      ...typography.caption,
      color: colors.textTertiary,
      marginHorizontal: spacing.md,
    },
    googleButton: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    googleButtonText: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: '600',
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
