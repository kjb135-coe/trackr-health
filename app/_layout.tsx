import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { ThemeProvider, useTheme, lightColors, darkColors } from '@/src/theme';
import { useAuthStore, useOnboardingStore } from '@/src/store';
import { getDatabase } from '@/src/database';
import { ErrorBoundary as AppErrorBoundary } from '@/src/components/ui';
import { ANIMATION_DURATION } from '@/src/utils/animations';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

// Custom navigation themes that match our app colors
const CustomLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: lightColors.primary,
    background: lightColors.background,
    card: lightColors.surface,
    text: lightColors.textPrimary,
    border: lightColors.border,
    notification: lightColors.error,
  },
};

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: darkColors.primary,
    background: darkColors.background,
    card: darkColors.surface,
    text: darkColors.textPrimary,
    border: darkColors.border,
    notification: darkColors.error,
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  const { initialize, isInitialized } = useAuthStore();
  const { hasCompleted: hasCompletedOnboarding, initialize: initOnboarding } = useOnboardingStore();

  useEffect(() => {
    // Initialize database
    getDatabase();

    // Initialize auth listener
    const unsubscribe = initialize();

    // Initialize onboarding state
    initOnboarding();

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && isInitialized && hasCompletedOnboarding !== null) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isInitialized, hasCompletedOnboarding]);

  if (!loaded || !isInitialized || hasCompletedOnboarding === null) {
    return null;
  }

  return (
    <AppErrorBoundary>
      <ThemeProvider>
        <RootLayoutNav />
      </ThemeProvider>
    </AppErrorBoundary>
  );
}

function RootLayoutNav() {
  const { isDark, colors } = useTheme();
  const { user } = useAuthStore();
  const { hasCompleted: hasCompletedOnboarding } = useOnboardingStore();
  const segments = useSegments();
  const router = useRouter();
  const isNavigating = useRef(false);

  useEffect(() => {
    if (hasCompletedOnboarding === null) return;
    if (isNavigating.current) return;

    const inAuthGroup = segments[0] === 'auth';
    const inOnboarding = segments[0] === 'onboarding';

    let shouldNavigate = false;

    // First time user - show onboarding
    if (!hasCompletedOnboarding && !inOnboarding) {
      isNavigating.current = true;
      router.replace('/onboarding');
      shouldNavigate = true;
    } else if (!user && !inAuthGroup && !inOnboarding) {
      // User is not signed in, redirect to login
      // For now, let's allow unauthenticated access but show login option
      // router.replace('/auth/login');
    } else if (user && !user.emailVerified && !inAuthGroup) {
      // User is signed in but email not verified
      // router.replace('/auth/verify-email');
    } else if (user && user.emailVerified && inAuthGroup) {
      // User is signed in and verified, redirect to app
      isNavigating.current = true;
      router.replace('/(tabs)');
      shouldNavigate = true;
    }

    if (shouldNavigate) {
      setTimeout(() => {
        isNavigating.current = false;
      }, ANIMATION_DURATION.screenTransition + 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, segments, hasCompletedOnboarding]);

  return (
    <NavigationThemeProvider value={isDark ? CustomDarkTheme : CustomLightTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
          animation: 'slide_from_right',
          animationDuration: ANIMATION_DURATION.screenTransition,
        }}
      >
        <Stack.Screen
          name="onboarding"
          options={{
            headerShown: false,
            animation: 'fade',
            animationDuration: ANIMATION_DURATION.fadeTransition,
          }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
            animation: 'fade',
            animationDuration: ANIMATION_DURATION.fadeTransition,
          }}
        />
        <Stack.Screen
          name="auth/login"
          options={{
            headerShown: false,
            presentation: 'modal',
            animation: 'slide_from_bottom',
            animationDuration: ANIMATION_DURATION.modalTransition,
          }}
        />
        <Stack.Screen
          name="auth/signup"
          options={{
            headerShown: false,
            presentation: 'modal',
            animation: 'slide_from_bottom',
            animationDuration: ANIMATION_DURATION.modalTransition,
          }}
        />
        <Stack.Screen
          name="auth/forgot-password"
          options={{
            headerShown: false,
            presentation: 'modal',
            animation: 'slide_from_bottom',
            animationDuration: ANIMATION_DURATION.modalTransition,
          }}
        />
        <Stack.Screen
          name="auth/verify-email"
          options={{
            headerShown: false,
            presentation: 'modal',
            animation: 'slide_from_bottom',
            animationDuration: ANIMATION_DURATION.modalTransition,
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            title: 'Settings',
            presentation: 'modal',
            animation: 'slide_from_bottom',
            animationDuration: ANIMATION_DURATION.modalTransition,
          }}
        />
        <Stack.Screen
          name="sleep/log"
          options={{
            headerShown: false,
            presentation: 'modal',
            animation: 'slide_from_bottom',
            animationDuration: ANIMATION_DURATION.modalTransition,
          }}
        />
        <Stack.Screen
          name="exercise/log"
          options={{
            headerShown: false,
            presentation: 'modal',
            animation: 'slide_from_bottom',
            animationDuration: ANIMATION_DURATION.modalTransition,
          }}
        />
        <Stack.Screen
          name="nutrition/camera"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            animation: 'fade',
            animationDuration: ANIMATION_DURATION.fadeTransition,
          }}
        />
        <Stack.Screen
          name="journal/new"
          options={{
            headerShown: false,
            presentation: 'modal',
            animation: 'slide_from_bottom',
            animationDuration: ANIMATION_DURATION.modalTransition,
          }}
        />
        <Stack.Screen
          name="journal/scan"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            animation: 'fade',
            animationDuration: ANIMATION_DURATION.fadeTransition,
          }}
        />
        <Stack.Screen
          name="goals"
          options={{
            headerShown: false,
            presentation: 'modal',
            animation: 'slide_from_bottom',
            animationDuration: ANIMATION_DURATION.modalTransition,
          }}
        />
      </Stack>
    </NavigationThemeProvider>
  );
}
