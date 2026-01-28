import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Plus, Camera, X, UtensilsCrossed } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, borderRadius } from '@/src/theme';
import { Card, Button } from '@/src/components/ui';
import { useNutritionStore } from '@/src/store';
import { getDateString, getRelativeDateLabel } from '@/src/utils/date';
import { MEAL_TYPE_LABELS, DEFAULT_CALORIE_GOAL } from '@/src/utils/constants';
import { MealType, FoodItem, DetectedFood } from '@/src/types';
import { hasApiKey } from '@/src/services/claude';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function NutritionScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');
  const [manualName, setManualName] = useState('');
  const [manualCalories, setManualCalories] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detectedFoods, setDetectedFoods] = useState<DetectedFood[]>([]);
  const [apiKeyExists, setApiKeyExists] = useState(false);

  const { meals, dailyTotals, isLoading, isAnalyzing, loadMealsForDate, loadDailyTotals, createMeal, analyzeImage } =
    useNutritionStore();

  const today = getDateString();

  useEffect(() => {
    loadData();
    checkApiKey();
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

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please grant camera permission to take photos of your food.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]) {
      setCapturedImage(result.assets[0].uri);

      if (apiKeyExists) {
        try {
          const analysis = await analyzeImage(result.assets[0].uri);
          setDetectedFoods(analysis.detectedFoods);
        } catch (error) {
          Alert.alert('Analysis failed', 'Could not analyze the food image. You can add items manually.');
        }
      }
    }
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please grant photo library permission.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]) {
      setCapturedImage(result.assets[0].uri);

      if (apiKeyExists) {
        try {
          const analysis = await analyzeImage(result.assets[0].uri);
          setDetectedFoods(analysis.detectedFoods);
        } catch (error) {
          Alert.alert('Analysis failed', 'Could not analyze the food image. You can add items manually.');
        }
      }
    }
  };

  const handleSaveMeal = async () => {
    let foods: Omit<FoodItem, 'id' | 'mealId'>[] = [];
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    if (detectedFoods.length > 0) {
      foods = detectedFoods.map((f) => ({
        name: f.name,
        quantity: 1,
        unit: f.portionEstimate,
        calories: f.calorieEstimate,
        protein: f.macroEstimates?.protein,
        carbs: f.macroEstimates?.carbs,
        fat: f.macroEstimates?.fat,
        isAIGenerated: true,
        confidence: f.confidence,
      }));
      totalCalories = detectedFoods.reduce((sum, f) => sum + f.calorieEstimate, 0);
      totalProtein = detectedFoods.reduce((sum, f) => sum + (f.macroEstimates?.protein || 0), 0);
      totalCarbs = detectedFoods.reduce((sum, f) => sum + (f.macroEstimates?.carbs || 0), 0);
      totalFat = detectedFoods.reduce((sum, f) => sum + (f.macroEstimates?.fat || 0), 0);
    } else if (manualName && manualCalories) {
      foods = [
        {
          name: manualName,
          quantity: 1,
          unit: 'serving',
          calories: parseInt(manualCalories) || 0,
          isAIGenerated: false,
        },
      ];
      totalCalories = parseInt(manualCalories) || 0;
    } else {
      Alert.alert('Missing info', 'Please add food items or take a photo.');
      return;
    }

    await createMeal(
      {
        date: today,
        mealType: selectedMealType,
        totalCalories,
        totalProtein: totalProtein || undefined,
        totalCarbs: totalCarbs || undefined,
        totalFat: totalFat || undefined,
        photoUri: capturedImage || undefined,
      },
      foods
    );

    resetModal();
  };

  const resetModal = () => {
    setModalVisible(false);
    setCapturedImage(null);
    setDetectedFoods([]);
    setManualName('');
    setManualCalories('');
  };

  const calorieProgress = Math.min(dailyTotals.calories / DEFAULT_CALORIE_GOAL, 1);
  const todayMeals = meals.filter((m) => m.date === today);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Daily Summary */}
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Today's Nutrition</Text>
          <View style={styles.calorieRow}>
            <Text style={styles.calorieValue}>{dailyTotals.calories}</Text>
            <Text style={styles.calorieLabel}>/ {DEFAULT_CALORIE_GOAL} cal</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${calorieProgress * 100}%` },
                calorieProgress > 1 && { backgroundColor: colors.warning },
              ]}
            />
          </View>
          <View style={styles.macroRow}>
            <View style={styles.macro}>
              <Text style={styles.macroValue}>{Math.round(dailyTotals.protein)}g</Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
            <View style={styles.macro}>
              <Text style={styles.macroValue}>{Math.round(dailyTotals.carbs)}g</Text>
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>
            <View style={styles.macro}>
              <Text style={styles.macroValue}>{Math.round(dailyTotals.fat)}g</Text>
              <Text style={styles.macroLabel}>Fat</Text>
            </View>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Today's Meals</Text>

        {todayMeals.length === 0 ? (
          <View style={styles.emptyState}>
            <UtensilsCrossed color={colors.nutrition} size={48} />
            <Text style={styles.emptyText}>No meals logged yet</Text>
            <Text style={styles.emptySubtext}>Tap + to log your food</Text>
          </View>
        ) : (
          todayMeals.map((meal) => (
            <Card key={meal.id} style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <Text style={styles.mealType}>{MEAL_TYPE_LABELS[meal.mealType]}</Text>
                <Text style={styles.mealCalories}>{meal.totalCalories} cal</Text>
              </View>
              {meal.foods.map((food, idx) => (
                <Text key={idx} style={styles.foodItem}>
                  {food.name} - {food.calories} cal
                </Text>
              ))}
            </Card>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Plus color={colors.white} size={24} />
      </TouchableOpacity>

      {/* Log Meal Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Meal</Text>
              <TouchableOpacity onPress={resetModal}>
                <X color={colors.textPrimary} size={24} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Meal Type</Text>
            <View style={styles.mealTypeRow}>
              {MEAL_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.mealTypeOption,
                    selectedMealType === type && styles.mealTypeSelected,
                  ]}
                  onPress={() => setSelectedMealType(type)}
                >
                  <Text
                    style={[
                      styles.mealTypeText,
                      selectedMealType === type && styles.mealTypeTextSelected,
                    ]}
                  >
                    {MEAL_TYPE_LABELS[type]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Camera Options */}
            <View style={styles.cameraRow}>
              <Button
                title="Take Photo"
                variant="secondary"
                onPress={handleTakePhoto}
                icon={<Camera color={colors.textPrimary} size={18} />}
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <Button
                title="Gallery"
                variant="secondary"
                onPress={handlePickImage}
                style={{ flex: 1 }}
              />
            </View>

            {isAnalyzing && (
              <View style={styles.analyzingContainer}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.analyzingText}>Analyzing food...</Text>
              </View>
            )}

            {capturedImage && (
              <Image source={{ uri: capturedImage }} style={styles.previewImage} />
            )}

            {detectedFoods.length > 0 && (
              <View style={styles.detectedFoods}>
                <Text style={styles.inputLabel}>Detected Foods</Text>
                {detectedFoods.map((food, idx) => (
                  <View key={idx} style={styles.detectedItem}>
                    <Text style={styles.detectedName}>{food.name}</Text>
                    <Text style={styles.detectedCalories}>{food.calorieEstimate} cal</Text>
                  </View>
                ))}
              </View>
            )}

            {!capturedImage && (
              <>
                <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>Or add manually</Text>
                <TextInput
                  style={styles.input}
                  value={manualName}
                  onChangeText={setManualName}
                  placeholder="Food name"
                  placeholderTextColor={colors.textTertiary}
                />
                <TextInput
                  style={styles.input}
                  value={manualCalories}
                  onChangeText={setManualCalories}
                  placeholder="Calories"
                  keyboardType="number-pad"
                  placeholderTextColor={colors.textTertiary}
                />
              </>
            )}

            <Button
              title="Save Meal"
              onPress={handleSaveMeal}
              loading={isLoading}
              disabled={detectedFoods.length === 0 && (!manualName || !manualCalories)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  summaryCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  summaryTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  calorieValue: {
    ...typography.h1,
    color: colors.nutrition,
  },
  calorieLabel: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.gray200,
    borderRadius: 4,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.nutrition,
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
    ...typography.h4,
    color: colors.textPrimary,
  },
  macroLabel: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.h4,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textTertiary,
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
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  mealCalories: {
    ...typography.body,
    color: colors.nutrition,
    fontWeight: '600',
  },
  foodItem: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.nutrition,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  mealTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  mealTypeOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  mealTypeSelected: {
    backgroundColor: colors.nutrition,
  },
  mealTypeText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  mealTypeTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  cameraRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  analyzingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  analyzingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  detectedFoods: {
    marginBottom: spacing.md,
  },
  detectedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  detectedName: {
    ...typography.body,
    color: colors.textPrimary,
  },
  detectedCalories: {
    ...typography.body,
    color: colors.nutrition,
    fontWeight: '600',
  },
});
