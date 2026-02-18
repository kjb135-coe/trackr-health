import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Target, Moon, Dumbbell, UtensilsCrossed, BookOpen, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { spacing, typography, useTheme, type ThemeColors } from '@/src/theme';
import { Button } from '@/src/components/ui';

const { width } = Dimensions.get('window');

const ONBOARDING_KEY = 'hasCompletedOnboarding';

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  const slides = [
    {
      id: '1',
      title: 'Track Your Habits',
      description:
        'Build positive routines with streak tracking and daily reminders. Never miss a day again.',
      Icon: Target,
      color: colors.primary,
    },
    {
      id: '2',
      title: 'Sleep Better',
      description:
        'Log your sleep patterns and discover insights to improve your rest and energy levels.',
      Icon: Moon,
      color: colors.sleep,
    },
    {
      id: '3',
      title: 'Stay Active',
      description: 'Track workouts, monitor your progress, and reach your fitness goals.',
      Icon: Dumbbell,
      color: colors.exercise,
    },
    {
      id: '4',
      title: 'Smart Nutrition',
      description: 'Take a photo of your food and let AI identify calories and macros instantly.',
      Icon: UtensilsCrossed,
      color: colors.nutrition,
    },
    {
      id: '5',
      title: 'Journal Your Journey',
      description: 'Write or scan handwritten entries. AI helps digitize your thoughts.',
      Icon: BookOpen,
      color: colors.journal,
    },
    {
      id: '6',
      title: 'Ready to Start?',
      description:
        'Your complete health companion is ready. Track everything in one beautiful app.',
      Icon: Sparkles,
      color: colors.success,
    },
  ];

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    completeOnboarding();
  };

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/(tabs)');
  };

  const renderSlide = ({ item }: { item: (typeof slides)[0] }) => {
    const Icon = item.Icon;
    return (
      <View style={styles.slide}>
        <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
          <Icon color={item.color} size={80} strokeWidth={1.5} />
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    );
  };

  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {slides.map((_, index) => {
          const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });
          return <Animated.View key={index} style={[styles.dot, { width: dotWidth, opacity }]} />;
        })}
      </View>
    );
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {renderDots()}

      <View style={styles.footer}>
        <Button
          title={currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
          onPress={handleNext}
          style={styles.button}
        />
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
    skipButton: {
      position: 'absolute',
      top: 60,
      right: spacing.lg,
      zIndex: 10,
      padding: spacing.sm,
    },
    skipText: {
      ...typography.body,
      color: colors.textSecondary,
    },
    slide: {
      width,
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
    },
    iconContainer: {
      width: 160,
      height: 160,
      borderRadius: 80,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    title: {
      ...typography.h1,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    description: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: spacing.lg,
      lineHeight: 24,
    },
    dotsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    dot: {
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
      marginHorizontal: 4,
    },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    button: {
      marginBottom: spacing.md,
    },
  });

export { ONBOARDING_KEY };
