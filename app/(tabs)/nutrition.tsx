import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Plus, UtensilsCrossed, Sparkles } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, borderRadius } from '@/src/theme';
import { isToday, parseISO } from 'date-fns';
import {
  AnimatedButton,
  AnimatedCard,
  DateNavigator,
  FAB,
  SkeletonCard,
  ErrorBanner,
  EmptyState,
} from '@/src/components/ui';
import { useNutritionStore, useAIInsightsStore, useGoalsStore } from '@/src/store';
import { getDateString } from '@/src/utils/date';
import { MEAL_TYPE_LABELS, TAB_CONTENT_PADDING_BOTTOM } from '@/src/utils/constants';
import { useApiKeyExists } from '@/src/services/claude';
import { NutritionLogModal } from '@/src/components/nutrition';
import { Meal } from '@/src/types';

export default function NutritionScreen() {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const apiKeyExists = useApiKeyExists();
  const [selectedDate, setSelectedDate] = useState(getDateString());
  const [editMeal, setEditMeal] = useState<Meal | undefined>();
  const [showNutritionAdvice, setShowNutritionAdvice] = useState(false);

  const {
    meals,
    dailyTotals,
    isLoading,
    error,
    loadMealsForDate,
    loadDailyTotals,
    deleteMeal,
    clearError,
  } = useNutritionStore();
  const { nutritionAdvice, isLoadingNutrition, fetchNutritionAdvice } = useAIInsightsStore();
  const { goals } = useGoalsStore();
  const calorieGoal = goals.dailyCalories;

  useEffect(() => {
    loadData(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async (date: string) => {
    await loadMealsForDate(date);
    await loadDailyTotals(date);
  };

  const handleDateChange = async (date: string) => {
    setSelectedDate(date);
    await loadData(date);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(selectedDate);
    setRefreshing(false);
  };

  const handleDeleteMeal = (id: string, name: string) => {
    Alert.alert('Delete Meal', `Delete ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteMeal(id);
          await loadDailyTotals(selectedDate);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const handleGetNutritionAdvice = () => {
    setShowNutritionAdvice(true);
    fetchNutritionAdvice();
  };

  const calorieProgress = Math.min(dailyTotals.calories / calorieGoal, 1);
  const dateMeals = useMemo(
    () => meals.filter((m) => m.date === selectedDate),
    [meals, selectedDate],
  );
  const isViewingToday = useMemo(() => isToday(parseISO(selectedDate)), [selectedDate]);

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
        <DateNavigator date={selectedDate} onDateChange={handleDateChange} />

        {error && <ErrorBanner error={error} onDismiss={clearError} />}

        {/* Daily Summary */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <AnimatedCard style={styles.summaryCard}>
            <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>
              {isViewingToday ? "Today's Nutrition" : 'Daily Nutrition'}
            </Text>
            <View style={styles.calorieRow}>
              <Text style={[styles.calorieValue, { color: colors.nutrition }]}>
                {dailyTotals.calories}
              </Text>
              <Text style={[styles.calorieLabel, { color: colors.textSecondary }]}>
                / {calorieGoal} cal
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
            {isViewingToday ? "Today's Meals" : 'Meals'}
          </Text>
        </Animated.View>

        {isLoading && meals.length === 0 ? (
          <>
            <SkeletonCard lines={2} style={{ marginBottom: spacing.sm }} />
            <SkeletonCard lines={2} style={{ marginBottom: spacing.sm }} />
          </>
        ) : dateMeals.length === 0 ? (
          <EmptyState
            icon={<UtensilsCrossed color={colors.nutrition} size={48} />}
            title="No meals logged yet"
            subtitle="Tap + to log your food"
          />
        ) : (
          dateMeals.map((meal, index) => (
            <Animated.View
              key={meal.id}
              entering={FadeInDown.duration(400).delay(150 + index * 50)}
            >
              <AnimatedCard
                style={styles.mealCard}
                delay={index * 50}
                onPress={() => {
                  setEditMeal(meal);
                  setModalVisible(true);
                }}
                onLongPress={() =>
                  handleDeleteMeal(meal.id, MEAL_TYPE_LABELS[meal.mealType] || meal.mealType)
                }
              >
                <View style={styles.mealHeader}>
                  <Text style={[styles.mealType, { color: colors.textPrimary }]}>
                    {MEAL_TYPE_LABELS[meal.mealType]}
                  </Text>
                  <Text style={[styles.mealCalories, { color: colors.nutrition }]}>
                    {meal.totalCalories} cal
                  </Text>
                </View>
                {meal.foods.map((food) => (
                  <Text key={food.id} style={[styles.foodItem, { color: colors.textSecondary }]}>
                    {food.name} - {food.calories} cal
                  </Text>
                ))}
              </AnimatedCard>
            </Animated.View>
          ))
        )}

        {/* AI Nutrition Advice */}
        {apiKeyExists && meals.length >= 3 && (
          <Animated.View entering={FadeInDown.duration(400).delay(200)}>
            {!showNutritionAdvice ? (
              <TouchableOpacity
                style={[styles.aiSection, { backgroundColor: colors.surfaceSecondary }]}
                onPress={handleGetNutritionAdvice}
              >
                <Sparkles color={colors.nutrition} size={20} />
                <Text style={[styles.aiSectionText, { color: colors.textPrimary }]}>
                  Get AI Nutrition Advice
                </Text>
              </TouchableOpacity>
            ) : (
              <AnimatedCard style={styles.adviceCard} delay={100}>
                <View style={styles.adviceHeader}>
                  <Sparkles color={colors.nutrition} size={20} />
                  <Text style={[styles.adviceTitle, { color: colors.textPrimary }]}>
                    Nutrition Advice
                  </Text>
                </View>

                {isLoadingNutrition ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color={colors.nutrition} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                      Analyzing your nutrition data...
                    </Text>
                  </View>
                ) : nutritionAdvice ? (
                  <>
                    <Text style={[styles.adviceText, { color: colors.textSecondary }]}>
                      {nutritionAdvice.advice}
                    </Text>

                    {nutritionAdvice.suggestions.length > 0 && (
                      <>
                        <Text style={[styles.suggestionsTitle, { color: colors.textSecondary }]}>
                          Suggestions:
                        </Text>
                        {nutritionAdvice.suggestions.map((suggestion) => (
                          <View key={suggestion} style={styles.suggestionItem}>
                            <Text style={[styles.suggestionBullet, { color: colors.nutrition }]}>
                              •
                            </Text>
                            <Text style={[styles.suggestionText, { color: colors.textSecondary }]}>
                              {suggestion}
                            </Text>
                          </View>
                        ))}
                      </>
                    )}

                    <AnimatedButton
                      title="Refresh Advice"
                      variant="secondary"
                      onPress={handleGetNutritionAdvice}
                      loading={isLoadingNutrition}
                      style={{ marginTop: spacing.md }}
                    />
                  </>
                ) : null}
              </AnimatedCard>
            )}
          </Animated.View>
        )}
      </ScrollView>

      <FAB
        color={colors.nutrition}
        onPress={() => {
          setEditMeal(undefined);
          setModalVisible(true);
        }}
        icon={<Plus color={colors.white} size={24} />}
      />

      <NutritionLogModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditMeal(undefined);
        }}
        apiKeyExists={apiKeyExists}
        date={selectedDate}
        editMeal={editMeal}
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
    paddingBottom: TAB_CONTENT_PADDING_BOTTOM,
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
  aiSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
  },
  aiSectionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    marginLeft: spacing.sm,
  },
  adviceCard: {
    padding: spacing.md,
    marginTop: spacing.md,
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  adviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: 14,
  },
  adviceText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  suggestionsTitle: {
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  suggestionItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  suggestionBullet: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  suggestionText: {
    fontSize: 14,
    lineHeight: 22,
    flex: 1,
  },
});
