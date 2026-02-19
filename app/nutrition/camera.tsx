import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { X, Camera, RotateCcw, Image as ImageIcon, Utensils } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme/ThemeContext';
import { ANIMATION_DURATION } from '@/src/utils/animations';
import { spacing, borderRadius } from '@/src/theme';
import { AnimatedButton, AnimatedCard } from '@/src/components/ui';
import { analyzeFoodImage, hasApiKey } from '@/src/services/claude';
import { useNutritionStore } from '@/src/store';
import { AIFoodAnalysis, MealType } from '@/src/types';
import { getDateString, getErrorMessage } from '@/src/utils/date';
import { MEAL_TYPE_LABELS } from '@/src/utils/constants';
import { persistImage } from '@/src/utils/imagePersist';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function NutritionCameraScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIFoodAnalysis | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');
  const { createMeal } = useNutritionStore();

  const handleTakePhoto = async () => {
    if (cameraRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const photo = await cameraRef.current.takePictureAsync();
      setCapturedPhoto(photo.uri);
      analyzePhoto(photo.uri);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCapturedPhoto(result.assets[0].uri);
      analyzePhoto(result.assets[0].uri);
    }
  };

  const analyzePhoto = async (imageUri: string) => {
    const hasKey = await hasApiKey();
    if (!hasKey) {
      Alert.alert(
        'API Key Required',
        'Please add your Claude API key in Settings to use AI food recognition.',
        [
          { text: 'Cancel', onPress: () => setCapturedPhoto(null) },
          { text: 'Go to Settings', onPress: () => router.push('/settings') },
        ],
      );
      return;
    }

    setAnalyzing(true);
    try {
      const result = await analyzeFoodImage(imageUri);
      setAnalysisResult(result);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: unknown) {
      Alert.alert('Analysis Failed', getErrorMessage(error));
      setCapturedPhoto(null);
    }
    setAnalyzing(false);
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setAnalysisResult(null);
  };

  const macroTotals = useMemo(() => {
    if (!analysisResult) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    let calories = 0,
      protein = 0,
      carbs = 0,
      fat = 0;
    for (const f of analysisResult.detectedFoods) {
      calories += f.calorieEstimate;
      protein += f.macroEstimates?.protein || 0;
      carbs += f.macroEstimates?.carbs || 0;
      fat += f.macroEstimates?.fat || 0;
    }
    return { calories, protein, carbs, fat };
  }, [analysisResult]);

  const handleSaveMeal = async () => {
    if (!analysisResult || saving) return;

    setSaving(true);
    const foods = analysisResult.detectedFoods;

    try {
      const persistedUri = capturedPhoto ? await persistImage(capturedPhoto) : undefined;
      await createMeal(
        {
          date: getDateString(),
          mealType: selectedMealType,
          name: foods.map((f) => f.name).join(', '),
          totalCalories: macroTotals.calories,
          totalProtein: macroTotals.protein,
          totalCarbs: macroTotals.carbs,
          totalFat: macroTotals.fat,
          photoUri: persistedUri,
          aiAnalysis: analysisResult,
        },
        foods.map((f) => ({
          name: f.name,
          quantity: 1,
          unit: f.portionEstimate,
          calories: f.calorieEstimate,
          protein: f.macroEstimates?.protein || 0,
          carbs: f.macroEstimates?.carbs || 0,
          fat: f.macroEstimates?.fat || 0,
          isAIGenerated: true,
          confidence: f.confidence,
        })),
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error: unknown) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.permissionContainer, { backgroundColor: colors.background }]}>
        <Camera color={colors.textSecondary} size={64} />
        <Text style={[styles.permissionTitle, { color: colors.textPrimary }]}>
          Camera Access Required
        </Text>
        <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
          We need camera access to take photos of your food for AI analysis.
        </Text>
        <AnimatedButton title="Grant Permission" onPress={requestPermission} />
        <AnimatedButton
          title="Cancel"
          variant="ghost"
          onPress={() => router.back()}
          style={{ marginTop: spacing.sm }}
        />
      </View>
    );
  }

  if (capturedPhoto) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X color={colors.white} size={24} />
          </TouchableOpacity>
        </View>

        <Image source={{ uri: capturedPhoto }} style={styles.previewImage} />

        {analyzing ? (
          <View style={styles.analyzingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.analyzingText}>Analyzing your food...</Text>
          </View>
        ) : analysisResult ? (
          <Animated.View
            entering={FadeInUp.duration(ANIMATION_DURATION.screenEntrance)}
            style={styles.resultsContainer}
          >
            <AnimatedCard style={styles.resultsCard}>
              <View style={styles.resultsHeader}>
                <Utensils color={colors.nutrition} size={24} />
                <Text style={[styles.resultsTitle, { color: colors.textPrimary }]}>
                  Food Detected
                </Text>
              </View>

              <View style={[styles.caloriesBadge, { backgroundColor: colors.nutrition + '20' }]}>
                <Text style={[styles.caloriesValue, { color: colors.nutrition }]}>
                  {macroTotals.calories}
                </Text>
                <Text style={[styles.caloriesLabel, { color: colors.textSecondary }]}>
                  calories
                </Text>
              </View>

              <View style={styles.foodList}>
                {analysisResult.detectedFoods.map((food) => (
                  <View
                    key={food.name}
                    style={[styles.foodItem, { borderBottomColor: colors.border }]}
                  >
                    <Text style={[styles.foodName, { color: colors.textPrimary }]}>
                      {food.name}
                    </Text>
                    <Text style={[styles.foodCalories, { color: colors.textSecondary }]}>
                      {food.calorieEstimate} cal
                    </Text>
                  </View>
                ))}
              </View>

              <View style={[styles.macros, { borderTopColor: colors.border }]}>
                <View style={styles.macroItem}>
                  <Text style={[styles.macroValue, { color: colors.textPrimary }]}>
                    {macroTotals.protein}g
                  </Text>
                  <Text style={[styles.macroLabel, { color: colors.textTertiary }]}>Protein</Text>
                </View>
                <View style={styles.macroItem}>
                  <Text style={[styles.macroValue, { color: colors.textPrimary }]}>
                    {macroTotals.carbs}g
                  </Text>
                  <Text style={[styles.macroLabel, { color: colors.textTertiary }]}>Carbs</Text>
                </View>
                <View style={styles.macroItem}>
                  <Text style={[styles.macroValue, { color: colors.textPrimary }]}>
                    {macroTotals.fat}g
                  </Text>
                  <Text style={[styles.macroLabel, { color: colors.textTertiary }]}>Fat</Text>
                </View>
              </View>

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
                        selectedMealType === type && { color: colors.white, fontWeight: '600' },
                      ]}
                    >
                      {MEAL_TYPE_LABELS[type]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.actionButtons}>
                <AnimatedButton
                  title="Retake"
                  variant="secondary"
                  onPress={handleRetake}
                  style={styles.actionButton}
                />
                <AnimatedButton
                  title="Save Meal"
                  onPress={handleSaveMeal}
                  loading={saving}
                  style={styles.actionButton}
                />
              </View>
            </AnimatedCard>
          </Animated.View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X color={colors.white} size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.overlay}>
          <View style={styles.framingGuide} />
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.sideButton} onPress={handlePickImage}>
            <ImageIcon color={colors.white} size={28} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.captureButton} onPress={handleTakePhoto}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sideButton}
            onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
          >
            <RotateCcw color={colors.white} size={28} />
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>Take a photo of your food</Text>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    zIndex: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  framingGuide: {
    width: 280,
    height: 280,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderStyle: 'dashed',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
    gap: 40,
  },
  sideButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
  },
  hint: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzingText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: spacing.md,
  },
  resultsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  resultsCard: {
    padding: spacing.md,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  caloriesBadge: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  caloriesValue: {
    fontSize: 36,
    fontWeight: '700',
  },
  caloriesLabel: {
    fontSize: 12,
  },
  foodList: {
    marginBottom: spacing.md,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
  },
  foodName: {
    fontSize: 16,
  },
  foodCalories: {
    fontSize: 16,
  },
  macros: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    marginBottom: spacing.md,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  macroLabel: {
    fontSize: 12,
  },
  mealTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
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
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
