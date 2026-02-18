import React from 'react';
import { TouchableOpacity, Platform } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import {
  Home,
  Target,
  Moon,
  Dumbbell,
  UtensilsCrossed,
  BookOpen,
  Settings,
} from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing } from '@/src/theme';

function SettingsButton() {
  const router = useRouter();
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/settings');
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ marginRight: spacing.md }}
    >
      <Animated.View style={animatedStyle}>
        <Settings color={colors.textSecondary} size={24} />
      </Animated.View>
    </TouchableOpacity>
  );
}

interface TabIconProps {
  color: string;
  size: number;
  focused: boolean;
  Icon: typeof Home;
}

function AnimatedTabIcon({ color, size, focused, Icon }: TabIconProps) {
  const scale = useSharedValue(focused ? 1 : 0.9);

  React.useEffect(() => {
    scale.value = withSpring(focused ? 1.1 : 1, { damping: 15, stiffness: 300 });
  }, [focused, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Icon color={color} size={size} strokeWidth={focused ? 2.5 : 2} />
    </Animated.View>
  );
}

export default function TabLayout() {
  const { colors, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: isDark ? colors.surface : colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          height: Platform.OS === 'ios' ? 88 : 70,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 10,
          position: 'absolute',
          elevation: 0,
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDark ? 0.2 : 0.05,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
        headerStyle: {
          backgroundColor: colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 34,
          color: colors.textPrimary,
        },
        headerTitleAlign: 'left',
        headerShadowVisible: false,
        headerRight: () => <SettingsButton />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          headerTitle: 'Trackr',
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon color={color} size={size} focused={focused} Icon={Home} />
          ),
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Habits',
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon color={color} size={size} focused={focused} Icon={Target} />
          ),
        }}
      />
      <Tabs.Screen
        name="sleep"
        options={{
          title: 'Sleep',
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon color={color} size={size} focused={focused} Icon={Moon} />
          ),
        }}
      />
      <Tabs.Screen
        name="exercise"
        options={{
          title: 'Exercise',
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon color={color} size={size} focused={focused} Icon={Dumbbell} />
          ),
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrition',
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon color={color} size={size} focused={focused} Icon={UtensilsCrossed} />
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon color={color} size={size} focused={focused} Icon={BookOpen} />
          ),
        }}
      />
    </Tabs>
  );
}
