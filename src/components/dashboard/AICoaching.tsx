import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import {
  Sparkles,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  Moon,
  Dumbbell,
  Apple,
  BookOpen,
  RefreshCw,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, borderRadius } from '@/src/theme';
import { AnimatedCard } from '@/src/components/ui';
import { useAIInsightsStore } from '@/src/store';
import { hasApiKey } from '@/src/services/claude';

interface AICoachingProps {
  onSetupApiKey?: () => void;
}

export function AICoaching({ onSetupApiKey }: AICoachingProps) {
  const { colors } = useTheme();
  const [hasKey, setHasKey] = React.useState(false);

  const { dailyCoaching, isLoadingCoaching, error, fetchDailyCoaching } = useAIInsightsStore();

  useEffect(() => {
    checkApiKey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkApiKey = async () => {
    const exists = await hasApiKey();
    setHasKey(exists);
    if (exists) {
      fetchDailyCoaching();
    }
  };

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Force refresh by clearing cache
    useAIInsightsStore.setState({ lastCoachingFetch: null });
    await fetchDailyCoaching();
  };

  const categoryIcons = useMemo<Record<string, React.ReactNode>>(
    () => ({
      habits: <TrendingUp color={colors.habits} size={16} />,
      sleep: <Moon color={colors.sleep} size={16} />,
      exercise: <Dumbbell color={colors.exercise} size={16} />,
      nutrition: <Apple color={colors.nutrition} size={16} />,
      journal: <BookOpen color={colors.journal} size={16} />,
    }),
    [colors],
  );

  const categoryColors = useMemo<Record<string, string>>(
    () => ({
      habits: colors.habits,
      sleep: colors.sleep,
      exercise: colors.exercise,
      nutrition: colors.nutrition,
      journal: colors.journal,
    }),
    [colors],
  );

  const priorityColors = useMemo<Record<string, string>>(
    () => ({
      high: colors.error,
      medium: colors.warning,
    }),
    [colors],
  );

  if (!hasKey) {
    return (
      <Animated.View entering={FadeInDown.duration(400).delay(100)}>
        <AnimatedCard style={styles.card} delay={100}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Sparkles color={colors.primary} size={20} />
              <Text style={[styles.title, { color: colors.textPrimary }]}>AI Health Coach</Text>
            </View>
          </View>
          <View style={[styles.setupPrompt, { backgroundColor: colors.surfaceSecondary }]}>
            <AlertCircle color={colors.textTertiary} size={24} />
            <Text style={[styles.setupText, { color: colors.textSecondary }]}>
              Add your Claude API key to enable AI-powered health insights
            </Text>
            {onSetupApiKey && (
              <TouchableOpacity
                style={[styles.setupButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onSetupApiKey();
                }}
              >
                <Text style={styles.setupButtonText}>Set Up API Key</Text>
                <ChevronRight color={colors.white} size={16} />
              </TouchableOpacity>
            )}
          </View>
        </AnimatedCard>
      </Animated.View>
    );
  }

  if (isLoadingCoaching && !dailyCoaching) {
    return (
      <Animated.View entering={FadeInDown.duration(400).delay(100)}>
        <AnimatedCard style={styles.card} delay={100}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Sparkles color={colors.primary} size={20} />
              <Text style={[styles.title, { color: colors.textPrimary }]}>AI Health Coach</Text>
            </View>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Analyzing your health data...
            </Text>
          </View>
        </AnimatedCard>
      </Animated.View>
    );
  }

  if (error && !dailyCoaching) {
    return (
      <Animated.View entering={FadeInDown.duration(400).delay(100)}>
        <AnimatedCard style={styles.card} delay={100}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Sparkles color={colors.primary} size={20} />
              <Text style={[styles.title, { color: colors.textPrimary }]}>AI Health Coach</Text>
            </View>
          </View>
          <View style={[styles.errorContainer, { backgroundColor: colors.error + '10' }]}>
            <AlertCircle color={colors.error} size={20} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        </AnimatedCard>
      </Animated.View>
    );
  }

  if (!dailyCoaching) return null;

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(100)}>
      <AnimatedCard style={styles.card} delay={100}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Sparkles color={colors.primary} size={20} />
            <Text style={[styles.title, { color: colors.textPrimary }]}>AI Health Coach</Text>
          </View>
          <TouchableOpacity
            onPress={handleRefresh}
            style={styles.refreshButton}
            disabled={isLoadingCoaching}
          >
            {isLoadingCoaching ? (
              <ActivityIndicator color={colors.textTertiary} size="small" />
            ) : (
              <RefreshCw color={colors.textTertiary} size={18} />
            )}
          </TouchableOpacity>
        </View>

        {/* Greeting */}
        <Text style={[styles.greeting, { color: colors.textPrimary }]}>
          {dailyCoaching.greeting}
        </Text>

        {/* Insights */}
        {dailyCoaching.insights.slice(0, 3).map((insight) => (
          <View
            key={`${insight.category}-${insight.title}`}
            style={[
              styles.insightRow,
              { borderLeftColor: categoryColors[insight.category] ?? colors.primary },
            ]}
          >
            <View style={styles.insightHeader}>
              {categoryIcons[insight.category] ?? <Sparkles color={colors.primary} size={16} />}
              <Text style={[styles.insightTitle, { color: colors.textPrimary }]}>
                {insight.title}
              </Text>
              <View
                style={[
                  styles.priorityDot,
                  { backgroundColor: priorityColors[insight.priority] ?? colors.textTertiary },
                ]}
              />
            </View>
            <Text style={[styles.insightText, { color: colors.textSecondary }]}>
              {insight.insight}
            </Text>
            <Text style={[styles.suggestionText, { color: colors.primary }]}>
              💡 {insight.suggestion}
            </Text>
          </View>
        ))}

        {/* Daily Tip */}
        <View style={[styles.tipContainer, { backgroundColor: colors.primary + '10' }]}>
          <Text style={[styles.tipLabel, { color: colors.primary }]}>{"Today's Tip"}</Text>
          <Text style={[styles.tipText, { color: colors.textPrimary }]}>
            {dailyCoaching.dailyTip}
          </Text>
        </View>

        {/* Motivational Message */}
        <Text style={[styles.motivation, { color: colors.textSecondary }]}>
          {dailyCoaching.motivationalMessage}
        </Text>
      </AnimatedCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  refreshButton: {
    padding: spacing.xs,
  },
  greeting: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  insightRow: {
    paddingLeft: spacing.sm,
    borderLeftWidth: 3,
    marginBottom: spacing.md,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: spacing.xs,
    flex: 1,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  insightText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  tipContainer: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  tipLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
  },
  motivation: {
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    marginLeft: spacing.sm,
    fontSize: 14,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  errorText: {
    marginLeft: spacing.sm,
    fontSize: 14,
    flex: 1,
  },
  setupPrompt: {
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
  },
  setupText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  setupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  setupButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
});
