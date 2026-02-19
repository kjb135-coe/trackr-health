// Habit Types
export interface Habit {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  frequency: 'daily' | 'weekly' | 'custom';
  targetDaysPerWeek?: number;
  reminderTime?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  completedAt?: string;
  notes?: string;
}

// Sleep Types
export interface SleepEntry {
  id: string;
  date: string; // YYYY-MM-DD
  bedtime: string; // ISO timestamp
  wakeTime: string; // ISO timestamp
  durationMinutes: number;
  quality: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  factors?: string[];
  createdAt: string;
  updatedAt: string;
}

// Exercise Types
export type ExerciseType =
  | 'running'
  | 'walking'
  | 'cycling'
  | 'swimming'
  | 'weight_training'
  | 'yoga'
  | 'hiit'
  | 'sports'
  | 'cardio'
  | 'stretching'
  | 'other';

export type ExerciseIntensity = 'low' | 'moderate' | 'high' | 'very_high';

export interface ExerciseSession {
  id: string;
  date: string;
  type: ExerciseType;
  customType?: string;
  durationMinutes: number;
  intensity: ExerciseIntensity;
  caloriesBurned?: number;
  notes?: string;
  heartRateAvg?: number;
  heartRateMax?: number;
  distance?: number;
  distanceUnit?: 'km' | 'miles';
  createdAt: string;
  updatedAt: string;
}

// Nutrition Types
export interface FoodItem {
  id: string;
  mealId: string;
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  isAIGenerated: boolean;
  confidence?: number;
}

export interface DetectedFood {
  name: string;
  portionEstimate: string;
  calorieEstimate: number;
  macroEstimates?: {
    protein: number;
    carbs: number;
    fat: number;
  };
  confidence: number;
}

export interface AIFoodAnalysis {
  rawResponse: string;
  detectedFoods: DetectedFood[];
  processingTimeMs: number;
  modelUsed: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Meal {
  id: string;
  date: string;
  mealType: MealType;
  name?: string;
  foods: FoodItem[];
  totalCalories: number;
  totalProtein?: number;
  totalCarbs?: number;
  totalFat?: number;
  totalFiber?: number;
  photoUri?: string;
  aiAnalysis?: AIFoodAnalysis;
  createdAt: string;
  updatedAt: string;
}

// Journal Types
export interface JournalEntry {
  id: string;
  date: string;
  title?: string;
  content: string;
  mood?: 1 | 2 | 3 | 4 | 5;
  tags?: string[];
  isScanned: boolean;
  originalImageUri?: string;
  ocrConfidence?: number;
  createdAt: string;
  updatedAt: string;
}

export interface OCRResult {
  text: string;
  confidence: number;
  processingTimeMs: number;
  rawResponse: string;
}
