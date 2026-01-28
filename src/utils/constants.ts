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

export const MOOD_LABELS: Record<number, string> = {
  1: 'Terrible',
  2: 'Bad',
  3: 'Okay',
  4: 'Good',
  5: 'Great',
};

// Default calorie goals
export const DEFAULT_CALORIE_GOAL = 2000;

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
