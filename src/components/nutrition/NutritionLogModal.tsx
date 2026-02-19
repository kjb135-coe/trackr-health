import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Camera, X } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, borderRadius } from '@/src/theme';
import { AnimatedButton } from '@/src/components/ui';
import { useNutritionStore } from '@/src/store';
import { getDateString } from '@/src/utils/date';
import { MEAL_TYPE_LABELS } from '@/src/utils/constants';
import { MealType, FoodItem, DetectedFood } from '@/src/types';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

interface NutritionLogModalProps {
  visible: boolean;
  onClose: () => void;
  apiKeyExists: boolean;
}

export function NutritionLogModal({ visible, onClose, apiKeyExists }: NutritionLogModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');
  const [manualName, setManualName] = useState('');
  const [manualCalories, setManualCalories] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detectedFoods, setDetectedFoods] = useState<DetectedFood[]>([]);

  const { isLoading, isAnalyzing, createMeal, analyzeImage } = useNutritionStore();

  const today = getDateString();

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
        } catch {
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
        } catch {
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
      const parsedCalories = parseInt(manualCalories);
      if (isNaN(parsedCalories) || parsedCalories <= 0) {
        Alert.alert('Invalid calories', 'Calories must be a positive number.');
        return;
      }
      foods = [
        {
          name: manualName,
          quantity: 1,
          unit: 'serving',
          calories: parsedCalories,
          isAIGenerated: false,
        },
      ];
      totalCalories = parsedCalories;
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

    resetAndClose();
  };

  const resetAndClose = () => {
    setCapturedImage(null);
    setDetectedFoods([]);
    setManualName('');
    setManualCalories('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.surface,
              paddingBottom: Math.max(spacing.xxl, insets.bottom + spacing.md),
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Log Meal</Text>
            <TouchableOpacity onPress={resetAndClose}>
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
                    selectedMealType === type && { color: colors.white, fontWeight: '600' },
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
                <View key={idx} style={[styles.detectedItem, { borderBottomColor: colors.border }]}>
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
                style={[styles.inputLabel, { color: colors.textSecondary, marginTop: spacing.md }]}
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
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
