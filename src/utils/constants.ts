import { ThemeColors } from '@/src/theme/ThemeContext';

// Exercise type labels
export const EXERCISE_TYPE_LABELS: Record<string, string> = {
  running: 'Running',
  walking: 'Walking',
  cycling: 'Cycling',
  swimming: 'Swimming',
  weight_training: 'Weight Training',
  yoga: 'Yoga',
  hiit: 'HIIT',
  sports: 'Sports',
  cardio: 'Cardio',
  stretching: 'Stretching',
  other: 'Other',
};

export const INTENSITY_LABELS: Record<string, string> = {
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
  very_high: 'Very High',
};

export const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export const QUALITY_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

export function getQualityColor(quality: number, colors: ThemeColors): string {
  switch (quality) {
    case 1:
      return colors.error;
    case 2:
      return colors.warning;
    case 3:
      return colors.info;
    case 4:
      return colors.success;
    case 5:
      return colors.sleep;
    default:
      return colors.textTertiary;
  }
}

export const MOOD_LABELS: Record<number, string> = {
  1: 'Terrible',
  2: 'Bad',
  3: 'Okay',
  4: 'Good',
  5: 'Great',
};

// Sleep factors
export const SLEEP_FACTORS = [
  'caffeine',
  'alcohol',
  'stress',
  'exercise',
  'screen_time',
  'late_meal',
  'nap',
];

// Habit colors
export const HABIT_COLORS = [
  '#FF6B6B',
  '#845EF7',
  '#20C997',
  '#FFA94D',
  '#339AF0',
  '#F06595',
  '#A9E34B',
  '#4ECDC4',
];

// Calorie estimation
const BASE_CALORIES_PER_MINUTE: Record<string, number> = {
  running: 11,
  cycling: 8,
  swimming: 10,
  weight_training: 5,
  yoga: 3,
  hiit: 12,
  walking: 4,
  sports: 7,
  cardio: 9,
  stretching: 2,
  other: 6,
};

export function estimateCalories(type: string, durationMinutes: number, intensity: number): number {
  const base = BASE_CALORIES_PER_MINUTE[type] || 6;
  const intensityMultiplier = 0.6 + (intensity / 5) * 0.8;
  return Math.round(base * durationMinutes * intensityMultiplier);
}

// AI Configuration
export const AI_MODEL = 'claude-sonnet-4-20250514';
export const AI_MAX_TOKENS = 1024;
export const AI_MAX_TOKENS_MEDIUM = 512;
export const AI_MAX_TOKENS_BRIEF = 256;
export const AI_OCR_MAX_TOKENS = 4096;
const AI_TIMEOUT_MS = 30000;

// Layout
export const TAB_CONTENT_PADDING_BOTTOM = 100;

/** Race a promise against a timeout. Rejects with the given message if the timeout fires first. */
export function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(message)), AI_TIMEOUT_MS),
  );
  return Promise.race([promise, timeout]);
}

// Storage keys
export const STORAGE_KEYS = {
  CLAUDE_API_KEY: 'CLAUDE_API_KEY',
  THEME_MODE: '@trackr_theme_mode',
  GOALS: 'trackr_goals',
  AUTH_USER: 'trackr_auth_user',
  ONBOARDING_COMPLETE: '@trackr_onboarding_complete',
} as const;

// OCR confidence thresholds
export const OCR_CONFIDENCE: Record<'HIGH' | 'MEDIUM' | 'LOW', number> = {
  HIGH: 0.95,
  MEDIUM: 0.75,
  LOW: 0.5,
};

// App links
export const APP_LINKS = {
  APP_STORE: 'https://apps.apple.com/app/trackr-health',
  SUPPORT_EMAIL: 'mailto:support@trackr.app?subject=Trackr Support',
} as const;
