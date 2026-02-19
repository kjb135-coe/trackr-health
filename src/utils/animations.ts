/**
 * Centralized animation constants for consistent, polished animations.
 *
 * All duration, spring, scale, and translate values used across the app
 * should reference these constants instead of hardcoding numbers.
 */

/** Duration values in milliseconds */
export const ANIMATION_DURATION = {
  /** Screen content entrance animation */
  screenEntrance: 400,
  /** Card content entrance animation */
  cardEntrance: 350,
  /** Exit/dismiss animation (fast to avoid sluggishness) */
  exit: 200,
  /** Screen-level transition (Stack navigator) */
  screenTransition: 300,
  /** Modal slide-up transition */
  modalTransition: 350,
  /** Fade transition (camera, tab switch) */
  fadeTransition: 250,
} as const;

/** Stagger delay values in milliseconds */
export const STAGGER_DELAY = {
  /** Between list items */
  listItem: 50,
  /** Between sections */
  section: 60,
  /** Initial offset — delays content animation until screen transition settles */
  initialOffset: 150,
} as const;

/** Spring configs for react-native-reanimated withSpring() */
export const SPRING_CONFIG = {
  /** Press-in feedback (quick, snappy) */
  pressIn: { damping: 15, stiffness: 400 },
  /** Press-out / release (quick, snappy) */
  pressOut: { damping: 15, stiffness: 400 },
  /** Bounce on button tap */
  bounce: { damping: 10, stiffness: 300 },
  /** Content entrance (soft landing) */
  entrance: { damping: 20, stiffness: 90 },
  /** Tab icon scale */
  tabIcon: { damping: 15, stiffness: 300 },
  /** Streak celebration entrance */
  celebration: { damping: 7, stiffness: 50 },
} as const;

/** Scale transform values */
export const SCALE = {
  /** Card press-in scale */
  cardPressIn: 0.97,
  /** Button press-in scale */
  buttonPressIn: 0.95,
  /** Button bounce mid-point */
  buttonBounce: 0.92,
  /** Quick action press-in */
  quickActionPressIn: 0.9,
  /** Quick action bounce mid-point */
  quickActionBounce: 0.85,
  /** Settings row press-in */
  settingRow: 0.98,
  /** Tab icon focused */
  tabIconFocused: 1.1,
  /** Tab icon unfocused */
  tabIconUnfocused: 1,
} as const;

/** Translate values in pixels */
export const TRANSLATE = {
  /** Card entrance translateY (reduced from 20 to minimize visual chaos during transitions) */
  cardEntranceY: 12,
} as const;
