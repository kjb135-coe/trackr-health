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
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, borderRadius } from '@/src/theme';
import { AnimatedCard, AnimatedButton } from '@/src/components/ui';
import { useNutritionStore } from '@/src/store';
import { getDateString, getRelativeDateLabel } from '@/src/utils/date';
import { MEAL_TYPE_LABELS, DEFAULT_CALORIE_GOAL } from '@/src/utils/constants';
import { MealType, FoodItem, DetectedFood } from '@/src/types';
import { hasApiKey } from '@/src/services/claude';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function NutritionScreen() {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');
  const [manualName, setManualName] = useState('');
  const [manualCalories, setManualCalories] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detectedFoods, setDetectedFoods] = useState<DetectedFood[]>([]);
  const [apiKeyExists, setApiKeyExists] = useState(false);

  const {
    meals,
    dailyTotals,
    isLoading,
    isAnalyzing,
    loadMealsForDate,
    loadDailyTotals,
    createMeal,
    analyzeImage,
  } = useNutritionStore();

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
      Alert.alert(
        'Permission needed',
        'Please grant camera permission to take photos of your food.',
      );
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
          Alert.alert(
            'Analysis failed',
            'Could not analyze the food image. You can add items manually.',
          );
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
          Alert.alert(
            'Analysis failed',
            'Could not analyze the food image. You can add items manually.',
          );
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
      foods,
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

      {/* Log Meal Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Animated.View
            entering={FadeInDown.duration(300)}
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Log Meal</Text>
              <TouchableOpacity onPress={resetModal}>
                <X color={colors.textPrimary} size={24} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Meal Type</Text>
            <View style={styles.mealTypeRow}>
              {MEAL_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.mealTypeOption,
                    { backgroundColor: colors.surfaceSecondary },
                    selectedMealType === type && { backgroundColor: colors.nutrition },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedMealType(type);
                  }}
                >
                  <Text
                    style={[
                      styles.mealTypeText,
                      { color: colors.textSecondary },
                      selectedMealType === type && { color: '#FFFFFF', fontWeight: '600' },
                    ]}
                  >
                    {MEAL_TYPE_LABELS[type]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Camera Options */}
            <View style={styles.cameraRow}>
              <AnimatedButton
                title="Take Photo"
                variant="secondary"
                onPress={handleTakePhoto}
                icon={<Camera color={colors.textPrimary} size={18} />}
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <AnimatedButton
                title="Gallery"
                variant="secondary"
                onPress={handlePickImage}
                style={{ flex: 1 }}
              />
            </View>

            {isAnalyzing && (
              <View style={styles.analyzingContainer}>
                <ActivityIndicator color={colors.primary} />
                <Text style={[styles.analyzingText, { color: colors.textSecondary }]}>
                  Analyzing food...
                </Text>
              </View>
            )}

            {capturedImage && <Image source={{ uri: capturedImage }} style={styles.previewImage} />}

            {detectedFoods.length > 0 && (
              <View style={styles.detectedFoods}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Detected Foods
                </Text>
                {detectedFoods.map((food, idx) => (
                  <View
                    key={idx}
                    style={[styles.detectedItem, { borderBottomColor: colors.border }]}
                  >
                    <Text style={[styles.detectedName, { color: colors.textPrimary }]}>
                      {food.name}
                    </Text>
                    <Text style={[styles.detectedCalories, { color: colors.nutrition }]}>
                      {food.calorieEstimate} cal
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {!capturedImage && (
              <>
                <Text
                  style={[
                    styles.inputLabel,
                    { color: colors.textSecondary, marginTop: spacing.md },
                  ]}
                >
                  Or add manually
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary },
                  ]}
                  value={manualName}
                  onChangeText={setManualName}
                  placeholder="Food name"
                  placeholderTextColor={colors.textTertiary}
                />
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary },
                  ]}
                  value={manualCalories}
                  onChangeText={setManualCalories}
                  placeholder="Calories"
                  keyboardType="number-pad"
                  placeholderTextColor={colors.textTertiary}
                />
              </>
            )}

            <AnimatedButton
              title="Save Meal"
              onPress={handleSaveMeal}
              loading={isLoading}
              disabled={detectedFoods.length === 0 && (!manualName || !manualCalories)}
              fullWidth
            />
          </Animated.View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
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
    fontSize: 18,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  input: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
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
    borderRadius: borderRadius.md,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  mealTypeText: {
    fontSize: 12,
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
    fontSize: 16,
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
  },
  detectedName: {
    fontSize: 16,
  },
  detectedCalories: {
    fontSize: 16,
    fontWeight: '600',
  },
});
