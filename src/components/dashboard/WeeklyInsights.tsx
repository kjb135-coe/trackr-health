import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '@/src/theme/ThemeContext';
import { ANIMATION_DURATION } from '@/src/utils/animations';
import { spacing, borderRadius } from '@/src/theme';

interface InsightData {
  label: string;
  current: number;
  previous: number;
  unit: string;
  color: string;
  higherIsBetter: boolean;
}

interface WeeklyInsightsProps {
  insights: InsightData[];
}

export function WeeklyInsights({ insights }: WeeklyInsightsProps) {
  const { colors } = useTheme();

  const getTrend = (current: number, previous: number, higherIsBetter: boolean) => {
    if (previous === 0) return { type: 'neutral', percent: 0 };
    const change = ((current - previous) / previous) * 100;

    if (Math.abs(change) < 5) return { type: 'neutral', percent: Math.round(change) };

    if (higherIsBetter) {
      return change > 0
        ? { type: 'positive', percent: Math.round(change) }
        : { type: 'negative', percent: Math.round(change) };
    } else {
      return change < 0
        ? { type: 'positive', percent: Math.round(Math.abs(change)) }
        : { type: 'negative', percent: Math.round(change) };
    }
  };

  const TrendIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'positive':
        return <TrendingUp size={14} color={colors.success} />;
      case 'negative':
        return <TrendingDown size={14} color={colors.error} />;
      default:
        return <Minus size={14} color={colors.textTertiary} />;
    }
  };

  return (
    <Animated.View
      entering={FadeIn.duration(ANIMATION_DURATION.screenEntrance)}
      style={[styles.container, { backgroundColor: colors.surface }]}
    >
      <Text style={[styles.title, { color: colors.textPrimary }]}>Weekly Progress</Text>
      <Text style={[styles.subtitle, { color: colors.textTertiary }]}>Compared to last week</Text>

      <View style={styles.insightsGrid}>
        {insights.map((insight, index) => {
          const trend = getTrend(insight.current, insight.previous, insight.higherIsBetter);
          const isLast = index === insights.length - 1;
          return (
            <View
              key={insight.label}
              style={[
                styles.insightItem,
                !isLast && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <View style={[styles.colorDot, { backgroundColor: insight.color }]} />
              <View style={styles.insightContent}>
                <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>
                  {insight.label}
                </Text>
                <View style={styles.insightValue}>
                  <Text style={[styles.valueText, { color: colors.textPrimary }]}>
                    {insight.current}
                    {insight.unit}
                  </Text>
                  <View style={styles.trendContainer}>
                    <TrendIcon type={trend.type} />
                    <Text
                      style={[
                        styles.trendText,
                        { color: colors.textTertiary },
                        trend.type === 'positive' && { color: colors.success },
                        trend.type === 'negative' && { color: colors.error },
                      ]}
                    >
                      {trend.percent > 0 ? '+' : ''}
                      {trend.percent}%
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: spacing.md,
  },
  insightsGrid: {
    gap: 0,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  insightContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insightLabel: {
    fontSize: 15,
    fontWeight: '400',
  },
  insightValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  valueText: {
    fontSize: 15,
    fontWeight: '600',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minWidth: 50,
  },
  trendText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
