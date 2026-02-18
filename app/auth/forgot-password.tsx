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
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { spacing, typography, borderRadius, useTheme, type ThemeColors } from '@/src/theme';
import { Button } from '@/src/components/ui';
import { useAuthStore } from '@/src/store';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const { sendPasswordReset, isLoading } = useAuthStore();

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    try {
      await sendPasswordReset(email.trim());
      setSent(true);
    } catch (err: unknown) {
      const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : '';
      Alert.alert('Error', getErrorMessage(code));
    }
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.subtitle}>
            {"We've sent a password reset link to "}
            {email}
          </Text>

          <Button
            title="Back to Login"
            onPress={() => router.push('/auth/login')}
            style={styles.button}
          />

          <TouchableOpacity onPress={() => setSent(false)} style={styles.resendLink}>
            <Text style={styles.resendText}>{"Didn't receive the email? Try again"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ArrowLeft color={colors.textPrimary} size={24} />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          {"Enter your email and we'll send you a link to reset your password"}
        </Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textTertiary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            autoFocus
          />

          <Button
            title="Send Reset Link"
            onPress={handleReset}
            loading={isLoading}
            style={styles.button}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function getErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/user-not-found':
      return 'No account found with this email';
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
    backButton: {
      position: 'absolute',
      top: 60,
      left: spacing.md,
      padding: spacing.sm,
      zIndex: 1,
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
      paddingHorizontal: spacing.md,
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
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    button: {
      marginTop: spacing.sm,
    },
    resendLink: {
      marginTop: spacing.lg,
      alignItems: 'center',
    },
    resendText: {
      ...typography.body,
      color: colors.primary,
    },
  });
