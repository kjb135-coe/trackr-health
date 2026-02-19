import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Plus, X, UtensilsCrossed } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, borderRadius } from '@/src/theme';
import { AnimatedCard } from '@/src/components/ui';
import { useNutritionStore } from '@/src/store';
import { getDateString } from '@/src/utils/date';
import { MEAL_TYPE_LABELS, DEFAULT_CALORIE_GOAL } from '@/src/utils/constants';
import { hasApiKey } from '@/src/services/claude';
import { NutritionLogModal } from '@/src/components/nutrition/NutritionLogModal';

export default function NutritionScreen() {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [apiKeyExists, setApiKeyExists] = useState(false);

  const { meals, dailyTotals, error, loadMealsForDate, loadDailyTotals, clearError } =
    useNutritionStore();

  const today = getDateString();

  useEffect(() => {
    loadData();
    checkApiKey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    await loadMealsForDate(today);
    await loadDailyTotals(today);
  };

  const checkApiKey = async () => {
    const exists = await hasApiKey();
    setApiKeyExists(exists);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const calorieProgress = Math.min(dailyTotals.calories / DEFAULT_CALORIE_GOAL, 1);
  const todayMeals = meals.filter((m) => m.date === today);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <TouchableOpacity
            style={[styles.errorBanner, { backgroundColor: colors.error + '15' }]}
            onPress={clearError}
          >
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            <X color={colors.error} size={16} />
          </TouchableOpacity>
        )}

        {/* Daily Summary */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <AnimatedCard style={styles.summaryCard}>
            <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>
              {"Today's Nutrition"}
            </Text>
            <View style={styles.calorieRow}>
              <Text style={[styles.calorieValue, { color: colors.nutrition }]}>
                {dailyTotals.calories}
              </Text>
              <Text style={[styles.calorieLabel, { color: colors.textSecondary }]}>
                / {DEFAULT_CALORIE_GOAL} cal
              </Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${calorieProgress * 100}%`, backgroundColor: colors.nutrition },
                  calorieProgress > 1 && { backgroundColor: colors.warning },
                ]}
              />
            </View>
            <View style={styles.macroRow}>
              <View style={styles.macro}>
                <Text style={[styles.macroValue, { color: colors.textPrimary }]}>
                  {Math.round(dailyTotals.protein)}g
                </Text>
                <Text style={[styles.macroLabel, { color: colors.textTertiary }]}>Protein</Text>
              </View>
              <View style={styles.macro}>
                <Text style={[styles.macroValue, { color: colors.textPrimary }]}>
                  {Math.round(dailyTotals.carbs)}g
                </Text>
                <Text style={[styles.macroLabel, { color: colors.textTertiary }]}>Carbs</Text>
              </View>
              <View style={styles.macro}>
                <Text style={[styles.macroValue, { color: colors.textPrimary }]}>
                  {Math.round(dailyTotals.fat)}g
                </Text>
                <Text style={[styles.macroLabel, { color: colors.textTertiary }]}>Fat</Text>
              </View>
            </View>
          </AnimatedCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {"Today's Meals"}
          </Text>
        </Animated.View>

        {todayMeals.length === 0 ? (
          <View style={styles.emptyState}>
            <UtensilsCrossed color={colors.nutrition} size={48} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No meals logged yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
              Tap + to log your food
            </Text>
          </View>
        ) : (
          todayMeals.map((meal, index) => (
            <Animated.View
              key={meal.id}
              entering={FadeInDown.duration(400).delay(150 + index * 50)}
            >
              <AnimatedCard style={styles.mealCard} delay={index * 50}>
                <View style={styles.mealHeader}>
                  <Text style={[styles.mealType, { color: colors.textPrimary }]}>
                    {MEAL_TYPE_LABELS[meal.mealType]}
                  </Text>
                  <Text style={[styles.mealCalories, { color: colors.nutrition }]}>
                    {meal.totalCalories} cal
                  </Text>
                </View>
                {meal.foods.map((food, idx) => (
                  <Text key={idx} style={[styles.foodItem, { color: colors.textSecondary }]}>
                    {food.name} - {food.calories} cal
                  </Text>
                ))}
              </AnimatedCard>
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.nutrition }]}
        onPress={() => setModalVisible(true)}
      >
        <Plus color="#FFFFFF" size={24} />
      </TouchableOpacity>

      <NutritionLogModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        apiKeyExists={apiKeyExists}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
    marginRight: spacing.sm,
  },
  summaryCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  calorieValue: {
    fontSize: 36,
    fontWeight: '700',
  },
  calorieLabel: {
    fontSize: 16,
    marginLeft: spacing.xs,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macro: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  macroLabel: {
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: spacing.xs,
  },
  mealCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  mealType: {
    fontSize: 16,
    fontWeight: '600',
  },
  mealCalories: {
    fontSize: 16,
    fontWeight: '600',
  },
  foodItem: {
    fontSize: 14,
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
