# Changelog

All notable changes to Trackr will be documented in this file.

## [Unreleased]

## [1.6.0] - 2026-01-30

### Added
- **AI Health Coach** - Personalized daily coaching with insights across all health categories
- **AI Habit Suggestions** - Get AI-recommended habits based on your current routine
- **AI Sleep Analysis** - Pattern recognition, quality trends, and optimal bedtime recommendations
- **AI Exercise Recommendations** - Personalized workout suggestions based on your activity history
- **Environment Variables** - Added .env support for Claude API key configuration
- **AI Insights Store** - Centralized state management for all AI features

### Files Added
- `src/services/ai/healthInsightsAI.ts` - Comprehensive AI health insights service
- `src/services/ai/index.ts` - AI services barrel export
- `src/store/aiInsightsStore.ts` - Zustand store for AI insights
- `src/components/dashboard/AICoaching.tsx` - Dashboard AI coaching component
- `.env.example` - Environment variables template
- `.env` - Local environment configuration (gitignored)

### Files Modified
- `app/(tabs)/index.tsx` - Added AI Coaching component to dashboard
- `app/(tabs)/habits.tsx` - Added AI habit suggestions modal
- `app/(tabs)/sleep.tsx` - Added AI sleep analysis section
- `app/(tabs)/exercise.tsx` - Added AI workout recommendation section
- `src/services/claude/client.ts` - Support for env variable API key
- `src/store/index.ts` - Export AI insights store
- `src/components/dashboard/index.ts` - Export AICoaching component
- `.gitignore` - Added .env to ignored files

---

## [1.5.1] - 2026-01-30

### Improved
- **Complete Dark Mode Migration** - All screens now use dynamic theme colors
- **Enhanced Animations** - All tab screens and modal screens use staggered fade-in animations
- **Haptic Feedback** - Added haptic feedback to all interactive elements
- **Improved Component Props** - AnimatedCard and AnimatedButton now accept style arrays

### Files Modified
- `app/(tabs)/habits.tsx` - Full theme context integration with animations
- `app/(tabs)/sleep.tsx` - Full theme context integration with animations
- `app/(tabs)/exercise.tsx` - Full theme context integration with animations
- `app/(tabs)/nutrition.tsx` - Full theme context integration with animations
- `app/(tabs)/journal.tsx` - Full theme context integration with animations
- `app/exercise/log.tsx` - Full theme context integration with animations
- `app/journal/new.tsx` - Full theme context integration with animations
- `app/journal/scan.tsx` - Full theme context integration with animations
- `app/nutrition/camera.tsx` - Full theme context integration with animations
- `src/components/ui/AnimatedCard.tsx` - Accept StyleProp for style arrays
- `src/components/ui/AnimatedButton.tsx` - Accept StyleProp for style arrays

---

## [1.5.0] - 2026-01-29

### Added
- **Full Dark Mode Support** - System-aware dark mode with manual Light/Dark/Auto toggle
- **Theme Context System** - Centralized theme management with persistent preferences
- **Animated UI Components** - New AnimatedCard and AnimatedButton with spring physics
- **Animation Library** - FadeIn, ScaleIn, StaggeredList, and Skeleton loading components
- **Staggered Dashboard Animations** - Cards animate in sequence on load
- **Tab Icon Animations** - Tab bar icons scale on focus change
- **Haptic Feedback** - Tactile feedback throughout the app
- **Skeleton Loading States** - Beautiful shimmer loading placeholders
- **Improved Settings UI** - Redesigned settings with theme picker and better organization

### Files Added
- `src/theme/ThemeContext.tsx` - Theme provider with dark mode support
- `src/components/ui/AnimatedCard.tsx` - Animated card with press/enter animations
- `src/components/ui/AnimatedButton.tsx` - Animated button with bounce effects
- `src/components/ui/animations/FadeIn.tsx` - Fade-in animation wrapper
- `src/components/ui/animations/ScaleIn.tsx` - Scale-in animation wrapper
- `src/components/ui/animations/Skeleton.tsx` - Skeleton loading component
- `src/components/ui/animations/StaggeredList.tsx` - Staggered list animations
- `src/components/ui/animations/index.ts` - Animation components barrel

### Files Modified
- `app/_layout.tsx` - Added ThemeProvider wrapper, custom navigation themes
- `app/(tabs)/_layout.tsx` - Tab bar with animated icons and theme colors
- `app/(tabs)/index.tsx` - Dashboard with staggered animations, skeleton loading
- `app/settings.tsx` - Complete redesign with theme picker, animated rows
- `src/components/dashboard/QuickActions.tsx` - Theme-aware with button animations
- `src/components/dashboard/WeeklyInsights.tsx` - Theme-aware styling
- `src/theme/index.ts` - Added ThemeContext exports

---

## [1.4.0] - 2026-01-29

### Added
- **Habit Reminders** - Push notification system for habit reminders at custom times
- **Health Insights Service** - Real weekly trend calculations with comparison to previous week
- **CSV Export** - Export individual data categories (habits, sleep, exercise, nutrition, journal) as CSV files
- **Clear All Data** - Option to delete all health data from settings
- **Habit Completions Export** - Full habit completion history now included in JSON exports

### Files Added
- `src/services/notifications/habitReminders.ts` - Push notification scheduling for habits
- `src/services/notifications/index.ts` - Notifications service barrel export
- `src/services/insights/healthInsights.ts` - Weekly stats and trend calculations
- `src/services/insights/index.ts` - Insights service barrel export

### Files Modified
- `app/(tabs)/index.tsx` - Dashboard now uses real trend data from insights service
- `app/settings.tsx` - Added CSV export options and clear data functionality
- `src/database/repositories/habitRepository.ts` - Added `getAllCompletions()` method
- `src/services/export/dataExport.ts` - Now exports habit completions, fixed expo-file-system imports
- `src/services/claude/foodRecognition.ts` - Fixed expo-file-system import
- `src/services/claude/handwritingOCR.ts` - Fixed expo-file-system import

### Fixed
- Fixed expo-file-system imports to use legacy module for compatibility
- Fixed habit completions not being exported in JSON data export

---

## [1.3.0] - 2026-01-28

### Added
- **Quick Actions** - Floating quick action buttons on dashboard for fast logging
- **Weekly Insights** - Progress comparison widget showing trends vs last week
- **Sleep Log Screen** - Full-featured sleep logging with time pickers, quality rating, sleep factors
- **Exercise Log Screen** - Workout logging with exercise type selection, duration slider, intensity picker, calorie estimation
- **Nutrition Camera Screen** - AI-powered food scanning with camera, photo preview, nutrition results display
- **Journal New Entry Screen** - Rich text entry with mood selector, quick tags
- **Journal Scan Screen** - Handwriting OCR with camera, text editing, preview
- **Onboarding Flow** - 6-screen onboarding experience for new users with animated dots, feature highlights
- **Goals System** - Customizable health targets for sleep, exercise, calories, protein, habits, journaling
- **Streak Badges** - Visual streak indicators with milestone celebrations (7, 14, 21, 30, 60, 90, 100, 180, 365 days)
- **Streak Celebrations** - Animated modal celebrating streak milestones with haptic feedback
- **App Store Configuration** - Bundle ID, permissions, EAS build config ready for submission
- **Data Export** - Export all health data as JSON or individual CSV files with native sharing

### Files Added
- `app/onboarding.tsx` - Onboarding carousel screen
- `app/sleep/log.tsx` - Sleep entry logging screen
- `app/exercise/log.tsx` - Workout logging screen
- `app/nutrition/camera.tsx` - Food photo scanning screen
- `app/journal/new.tsx` - Text journal entry screen
- `app/journal/scan.tsx` - Handwriting scan screen
- `app/goals.tsx` - Goals configuration screen
- `src/components/dashboard/QuickActions.tsx` - Quick action buttons component
- `src/components/dashboard/WeeklyInsights.tsx` - Weekly progress widget
- `src/components/dashboard/index.ts` - Dashboard components barrel export
- `src/components/habits/StreakBadge.tsx` - Streak indicator component
- `src/components/habits/StreakCelebration.tsx` - Milestone celebration modal
- `src/components/habits/index.ts` - Habit components barrel export
- `src/store/goalsStore.ts` - Goals state management
- `eas.json` - EAS Build configuration for App Store submission
- `src/services/export/dataExport.ts` - Data export functionality
- `src/services/export/index.ts` - Export service barrel
- `src/services/auth/mockAuthService.ts` - Mock auth for development without Firebase

### Files Modified
- `app/_layout.tsx` - Added new screen routes, onboarding state check
- `app/(tabs)/_layout.tsx` - Added settings button to header
- `app/(tabs)/index.tsx` - Integrated QuickActions and WeeklyInsights components
- `app/settings.tsx` - Added goals link
- `app.json` - App Store configuration (bundle ID, permissions, version 1.3.0)
- `src/store/index.ts` - Added goals store export

### Dependencies Added
- `@react-native-async-storage/async-storage` - Onboarding and goals persistence
- `@react-native-community/slider` - Duration/intensity sliders

---

## [1.2.0] - 2026-01-28

### Added
- **Authentication System** - Full Firebase Auth integration
  - Email/password sign up with validation
  - Email/password sign in
  - Google Sign-In integration
  - Password reset flow
  - Email verification flow
  - Sign out functionality
- **Settings Screen** - Comprehensive settings with:
  - User profile display
  - Claude API key management (secure storage)
  - Notifications toggle
  - Dark mode toggle (UI only)
  - Rate app, share, contact support links
  - Privacy policy link
  - Sign out button
- **Auth State Management** - Zustand store for auth with Firebase listeners

### Files Added
- `app/settings.tsx` - Full settings screen
- `app/auth/login.tsx` - Login screen with email/Google
- `app/auth/signup.tsx` - Registration screen
- `app/auth/forgot-password.tsx` - Password reset screen
- `app/auth/verify-email.tsx` - Email verification screen
- `src/services/firebase/config.ts` - Firebase configuration
- `src/services/auth/authService.ts` - Auth service wrapper
- `src/store/authStore.ts` - Auth Zustand store

### Files Modified
- `app/_layout.tsx` - Auth state integration, protected routes

### Dependencies Added
- `@react-native-firebase/app` - Firebase core
- `@react-native-firebase/auth` - Firebase authentication
- `@react-native-google-signin/google-signin` - Google OAuth
- `expo-haptics` - Haptic feedback

---

## [1.1.0] - 2026-01-28

### Added
- Demo data population feature
- "Load Demo Data" button on dashboard for new users
- Sample habits, sleep entries, exercise sessions, meals, and journal entries
- Test banana image for nutrition AI testing (`assets/images/test-banana.jpg`)

### Files Added
- `src/utils/demoData.ts` - Demo data generation utility

### Files Modified
- `app/(tabs)/index.tsx` - Added demo data button and loading state

---

## [1.0.0] - 2026-01-28

### Added
- Initial release of Trackr health tracking app
- **Dashboard** - Overview cards for all tracking categories
- **Habit Tracking** - Create habits, track daily completions, view streaks
- **Sleep Tracking** - Log bedtime, wake time, duration, quality (1-5)
- **Exercise Tracking** - Log workouts with type, duration, intensity, calories
- **Nutrition Tracking** - Log meals with AI-powered food photo recognition
- **Journal** - Write entries or scan handwritten pages with AI OCR

### Technical Foundation
- React Native + Expo 54 setup
- Expo Router file-based navigation with 6 tabs
- SQLite database with migrations
- Zustand state management stores
- Claude API integration for AI features
- Theme system with design tokens

### Files Added
- `app/(tabs)/_layout.tsx` - Tab navigation configuration
- `app/(tabs)/index.tsx` - Dashboard screen
- `app/(tabs)/habits.tsx` - Habit tracking screen
- `app/(tabs)/sleep.tsx` - Sleep tracking screen
- `app/(tabs)/exercise.tsx` - Exercise tracking screen
- `app/(tabs)/nutrition.tsx` - Nutrition tracking with AI
- `app/(tabs)/journal.tsx` - Journal with OCR
- `src/components/ui/Button.tsx` - Reusable button component
- `src/components/ui/Card.tsx` - Reusable card component
- `src/components/ui/Input.tsx` - Reusable input component
- `src/database/index.ts` - SQLite initialization and migrations
- `src/database/repositories/` - Data access layer (habit, sleep, exercise, nutrition, journal)
- `src/services/claude/client.ts` - Claude API client
- `src/services/claude/foodRecognition.ts` - Food image analysis
- `src/services/claude/handwritingOCR.ts` - Handwriting transcription
- `src/store/` - Zustand stores for all features
- `src/theme/` - Design tokens (colors, spacing, typography)
- `src/types/index.ts` - TypeScript interfaces
- `src/utils/date.ts` - Date utilities
- `src/utils/constants.ts` - App constants

### Files Removed
- `app/(tabs)/two.tsx` - Default Expo template file
