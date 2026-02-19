# Trackr - Codebase Audit & TODO

> Generated 2026-02-18. Items marked `[Q]` need your input - edit your answer inline.
> Priority: **P0** = blocking/broken, **P1** = should fix soon, **P2** = nice to have, **P3** = future

---

## P0 - Critical / Blocking

### ~~1. No test suite~~ ✅
- Zero tests exist. No test runner configured.
- **Status:** 518+ tests across 49 suites with Jest + React Native Testing Library.

### ~~2. No linting or formatting~~ ✅
- No ESLint or Prettier config. No pre-commit hooks.
- **Status:** ESLint + Prettier configured with Expo recommended config. Husky pre-commit hooks with lint-staged active.
---

## P1 - Should Fix Soon

### 3. Firebase dependency is dead weight (~1MB)
- `firebase` v12.8.0 is in package.json but only imported in `src/store/authStore.ts` behind fully commented-out code.
- Auth is mocked (instant sign-in, no real backend).
- **Effort:** 30min to remove, 2-4h to implement real auth
- `[Q]` What should we do with auth?
  - **A)** Remove Firebase entirely, keep mock auth (simplest)
  - **B)** Remove Firebase, remove auth entirely (no login screens)
  - **C)** Implement real Firebase auth (requires Firebase project setup)
  - **D)** Switch to a different auth provider: ___
  - **Your answer:**
Don't touch auth or hosting right now.

### ~~4. Dark mode broken on several screens~~ ✅
- `app/auth/login.tsx`, `app/auth/signup.tsx`, `app/auth/forgot-password.tsx`, `app/auth/verify-email.tsx` use hardcoded light colors (e.g., `#f5f5f5`, `#333`, `white` backgrounds)
- `app/onboarding.tsx` has similar issues
- `app/goals.tsx` partially broken
- **Status:** All screens now use `useTheme()` with `createStyles(colors)` pattern.
- **Effort:** ~2h to fix all screens
- `[Q]` Fix dark mode on auth screens? **Yes** / **Skip for now** (auth is mock anyway)
Yes
- `[Q]` Fix dark mode on onboarding? **Yes** / **Skip for now**
Yes, fix everywhere. 

### ~~5. StreakBadge & StreakCelebration components unused~~ ✅
- `src/components/habits/StreakBadge.tsx` and `src/components/habits/StreakCelebration.tsx` exist but are never rendered.
- They appear to be finished components waiting to be integrated into the habits screen.
- **Status:** Both integrated into habits.tsx with streak milestones.

### 6. Accessibility is zero
- No `accessibilityLabel`, `accessibilityRole`, or `accessibilityHint` on any interactive element.
- No screen reader support.
- **Effort:** ~3-4h for full pass
- `[Q]` Priority? **Do it now** / **Next sprint** / **Backlog** Backlog

### 7. `expo-auth-session` unused
- Listed in dependencies but never imported anywhere.
- Likely leftover from planned OAuth integration.
- `[Q]` Remove it? **Yes** / **Keep for planned OAuth**
Keep

---

## P2 - Nice to Have

### ~~8. No CI/CD pipeline~~ ✅
- No GitHub Actions, no automated checks on PRs.
- **Effort:** ~1-2h
- `[Q]` Set up GitHub Actions with type-check + lint + test? **Yes** / **Later**
Yes
- **Status:** CI workflow already exists at `.github/workflows/ci.yml` with type check, lint, and test.

### ~~18. Fix 14 ESLint errors across codebase~~ ✅
- Unescaped JSX entities (`'` and `"`) in exercise, habits/new, goals, AICoaching, StreakCelebration screens
- **Status:** 0 ESLint errors, 0 warnings.

### ~~9. `colors` vs `useTheme()` inconsistency~~ ✅
- Some files import `colors` directly from `@/src/theme` (static light-only), while others properly use `useTheme()`.
- **Status:** All components now use `useTheme()` hook. No direct `colors` imports remain.

### ~~10. Export service error handling~~ ✅
- **Status:** Fixed — uses `unknown` + `getErrorMessage()`.

### ~~11. Console statements in production code~~ ✅
- **Status:** Fixed — no console statements in production code.

### ~~12. Hardcoded version string~~ ✅
- **Status:** Fixed — reads from `Constants.expoConfig?.version`.

### 93. ~~Improve JSON parsing in foodRecognition.ts~~ ✅
- `parseJsonFromResponse()` only used regex extraction. If Claude returned pure JSON, the regex still ran unnecessarily.
- **Status:** Done — try `JSON.parse(text)` first for pure JSON, fall back to regex for markdown-wrapped responses. Added test for wrapped JSON path.

### 94. ~~Add try-catch to modal save operations~~ ✅
- All modal save handlers lacked try-catch — failures gave no user feedback.
- **Status:** Done — wrapped save operations in all 6 modal components (NutritionLogModal, JournalEntryModal, ExerciseLogModal, SleepLogModal, CreateHabitModal, HabitSuggestionsModal) with try-catch + `Alert.alert('Save failed', getErrorMessage(error))`.

### 98. ~~Extract reusable EmptyState component~~ ✅
- All 5 tab screens had duplicate empty state pattern (container View + title Text + subtitle Text + identical styles).
- **Status:** Done — created `EmptyState` component in `src/components/ui/`. Updated all 5 screens. Removed ~60 lines of duplicate styles.

### 97. ~~Add ErrorBanner and DateNavigator UI component tests~~ ✅
- Two core reusable UI components used across all tab screens had no test coverage.
- **Status:** Done — ErrorBanner (2 tests): rendering and dismiss callback. DateNavigator (4 tests): today/yesterday labels, navigation to today, disabled forward on today. 334 total tests.

### 96. ~~Add habitReminders notification service tests~~ ✅
- No tests for notification scheduling, cancellation, or permission handling.
- **Status:** Done — 10 tests covering permission requests (granted/denied), scheduling, cancellation (single/all), filtering, and listener setup/cleanup. 328 total tests.

### 95. ~~Memoize AICoaching switch statements~~ ✅
- Three helper functions (`getCategoryIcon`, `getCategoryColor`, `getPriorityColor`) recreated on every render in `AICoaching.tsx`.
- **Status:** Done — replaced with `useMemo` lookup objects. Icons and colors now cached between renders.

---

## P3 - Future / Low Priority

### ~~19. Fix 74 ESLint warnings (unused imports, missing useEffect deps)~~ ✅
- **Status:** 0 ESLint warnings remaining.
- **Effort:** ~1-2h

### ~~20. Expand test coverage beyond initial smoke tests~~ ✅
- **Status:** 518+ tests across 49 suites, 91%+ statement coverage.

### 22. ~~Add sleep, nutrition, and exercise store tests~~ ✅
- ~~Only habitStore has tests. sleepStore, nutritionStore, and exerciseStore follow the same pattern and should be tested.~~
- **Status:** Done — sleepStore (12 tests), exerciseStore (12 tests), nutritionStore (16 tests) added. 83 total tests passing.

### 21. ~~Several `catch (err: any)` patterns remain in auth screens~~ ✅
- ~~`app/auth/login.tsx` and `app/auth/signup.tsx` still use `catch (err: any)` with `err.code` access~~
- **Status:** Already fixed — all auth screen catch blocks use `catch (err: unknown)` with proper type narrowing.

### 13. ~~No data migration strategy~~ ✅
- ~~SQLite schema changes will break existing data without migrations.~~
- **Status:** Already implemented — `migrations` table + `runMigrations()` system exists in `src/database/index.ts`. Uses named migrations (e.g. `001_initial_schema`) with idempotent application tracking. New migrations just need to be appended to the migrations array.

### 14. No offline-first sync strategy
- All data is local SQLite only. No cloud backup/sync.
- Depends on auth decision (item #3).

### ~~179. Wire habitReminders notification service to habits UI~~ ✅
- `src/services/notifications/habitReminders.ts` is fully built and tested (10 tests) but never imported in any screen code.
- Needs: schedule reminder when habit is created, cancel when deleted, permission request, settings toggle.
- **Status:** Done — Added reminder toggle + time picker to CreateHabitModal, schedule on create/edit, cancel on disable/delete. Updated Habit type to support `null` for clearing. 5 new tests. 600 total.

### ~~180. Clean up redundant toBeTruthy() in component test assertions~~ ✅
- 159 instances of `expect(await findByText('X')).toBeTruthy()` across 21 test files. Since `findByText` already throws if not found, the `.toBeTruthy()` is redundant.
- **Status:** Done — replaced all 159 async `findBy*` assertions with bare `await findBy*()`. Kept 16 sync `getByText` and `toJSON` assertions (appropriate usage). 595 tests pass.

### ~~172. Deduplicate reanimated test mocks into shared helper~~ ✅
- 7 test files each define identical `stripAnimatedProps` + layout animation mocks for `react-native-reanimated`. Any future animation changes require updating all 7 mocks.
- **Status:** Done — extracted to `__tests__/helpers/reanimatedMock.ts`. All 7 test files import the shared mock.

### ~~173. Add onboardingStore tests~~ ✅
- New `src/store/onboardingStore.ts` was added for onboarding state management but has no test coverage.
- **Status:** Done — 7 tests covering initialize, setCompleted, legacy key migration, error fallback, AsyncStorage persistence. 585 total tests.

### ~~174. Extract duplicate auth error code mapping into shared utility~~ ✅
- 3 auth screens (login.tsx, signup.tsx, forgot-password.tsx) each define a local `getErrorMessage(code)` function with overlapping Firebase error codes.
- Also duplicate error code extraction pattern: `err && typeof err === 'object' && 'code' in err ? String(err.code) : ''`.
- **Status:** Done — created `getAuthErrorMessage(error)` in `src/services/auth/errorMessages.ts`. Consolidates 7 Firebase error codes + handles unknown error extraction. Replaced local functions in all 3 auth screens. 4 tests, 589 total.

### ~~178. Add demoData utility tests~~ ✅
- `src/utils/demoData.ts` populates demo habits, sleep, exercise, meals, and journal entries but had zero test coverage.
- **Status:** Done — 6 tests: habit creation (5 habits), completion seeding (35 calls), sleep entries (7 days), exercise sessions (randomized), meals (breakfast + lunch with food items), journal entries (3 entries with tags). 595 total tests.

### ~~177. Fix missing await in onboarding navigation handlers~~ ✅
- `handleNext` and `handleSkip` called async `completeOnboarding()` without awaiting — fire-and-forget pattern causes unhandled promise rejections if `setCompleted()` throws.
- **Status:** Done — made both handlers async and added await.

### ~~176. Fix auth code consistency: storage key, error handling, polling interval~~ ✅
- mockAuthService used hardcoded `AUTH_STORAGE_KEY` instead of `STORAGE_KEYS.AUTH_USER`. login.tsx had inconsistent error handling (manual checks vs `getAuthErrorMessage`). verify-email.tsx had hardcoded 5000ms polling interval.
- **Status:** Done — replaced local constant with `STORAGE_KEYS.AUTH_USER`, unified all error handlers to use `getAuthErrorMessage()`, extracted `EMAIL_VERIFICATION_POLL_MS` constant.

### ~~175. Add entrance animations to forgot-password and verify-email screens~~ ✅
- `login.tsx` and `signup.tsx` have `FadeInDown` entrance animations on title, subtitle, form, footer. `forgot-password.tsx` and `verify-email.tsx` have no entrance animations — inconsistent with the rest of the auth flow.
- **Status:** Done — added staggered FadeInDown entrance + FadeOut exit animations to both screens. All 4 auth screens now have consistent animation patterns.

### ~~15. No deep linking configuration~~ ✅
- Expo Router supports it but no scheme is configured.
- **Status:** Already configured — `"scheme": "trackr"` in app.json, `expo-linking` v8 and `expo-router` v6 installed. URLs like `trackr://habits` work out of the box.

### ~~181. Fix setSaving(false) leak in 3 modal save handlers~~ ✅
- `setSaving(false)` was placed after `try/catch` instead of in a `finally` block in CreateHabitModal, ExerciseLogModal, and SleepLogModal. If catch re-throws, the save button stays stuck in loading state.
- **Status:** Done — moved to `finally` block in all 3 modals.

### ~~182. Add zod validation to 6 healthInsightsAI JSON.parse() casts~~ ✅
- `healthInsightsAI.ts` uses `JSON.parse(content.text) as T` for DailyAICoaching, HabitSuggestion[], SleepAnalysis, ExerciseRecommendation, MoodAnalysis, and NutritionAdvice. These are unsafe casts — structurally invalid JSON won't be caught until runtime.
- **Status:** Done — added 7 zod schemas (AIInsight, DailyCoaching, HabitSuggestion, SleepAnalysis, ExerciseRecommendation, MoodAnalysis, NutritionAdvice). Replaced all 6 `as T` casts with `.parse()`. Added test for valid-JSON-wrong-shape fallback. 601 total tests.

### ~~183. Extract shared useImagePicker hook from nutrition and journal modals~~ — Skipped
- Structural similarity but every configurable detail differs (camera options, permission messages, AI service, error messages, no-API-key behavior). A parametrized hook would be more complex than the two inlined versions. Per CLAUDE.md: "three similar lines of code is better than a premature abstraction."

### ~~187. Fix unawaited async calls in 3 tab screens~~ ✅
- `nutrition.tsx` `handleGetNutritionAdvice` and `journal.tsx` `handleGetMoodAnalysis` called async store functions without await, silently dropping errors. `habits.tsx` `deleteHabit` was unawaited with no success haptic.
- **Status:** Done — added async/await to all 3 handlers, added success haptic to habit deletion matching sleep/exercise pattern.

### ~~186. Add onboarding screen tests~~ ✅
- `app/onboarding.tsx` (241 lines) had zero test coverage despite being the critical first-run flow.
- **Status:** Done — 6 tests: first slide render, description, Skip/Next buttons, skip completes onboarding + navigates, all 6 slide titles. 624 total tests.

### ~~185. Fix unsafe cast, dedup AICoaching, memoize slides/entries~~ ✅
- (a) Replaced unsafe `as { id_token?: string }` cast in login.tsx with type-safe property access.
- (b) Replaced duplicate `hasKey` state + `checkApiKey` effect in AICoaching with shared `useApiKeyExists` hook.
- (c) Memoized 6-element `slides` array in onboarding.tsx (prevents FlatList re-renders on state change).
- (d) Memoized `filteredByTag` and `displayedEntries` in journal.tsx (prevents filter on every keystroke).
- **Status:** Done — 4 files fixed, all 618 tests pass.

### ~~184. Add settings screen tests~~ ✅
- `app/settings.tsx` (716 lines) has zero test coverage. Contains critical paths: API key management, data export, account deletion, and theme switching.
- **Status:** Done — 17 tests: section titles, user info, API key save/empty/configured, sign out, goals navigation, export all/CSV/fail, clear data confirm, theme picker, privacy policy. 618 total tests.

### 16. ~~Image caching for food photos~~ ✅
- ~~Food recognition camera captures photos but doesn't persist them to a gallery.~~
- **Status:** Done — added `persistImage()` utility that copies photos from temp to `documentDirectory/images/`. Integrated into nutrition camera and journal scan screens.

### 17. No analytics or crash reporting
- No Sentry, Crashlytics, or similar.
- `[Q]` Want crash reporting? **Sentry** / **Firebase Crashlytics** / **None for now**

### 23. ~~Use centralized `getErrorMessage()` in store error handlers~~ ✅
- ~~Several stores (nutritionStore, exerciseStore, sleepStore) use `(error as Error).message` for error extraction~~
- **Status:** Done — replaced 28 occurrences across 5 stores (habit, sleep, exercise, nutrition, journal) with `getErrorMessage(error)`

### 24. ~~Add database repository tests~~ ✅ (partial)
- ~~All store tests mock the repository layer. No tests verify actual SQLite queries.~~
- **Status:** Added habitRepository tests (13 tests) covering getAll, getById, create, update, delete, completions, setCompletion, getStreak with mocked db. Other repos follow the same pattern.

### 25. ~~Fix N+1 query in nutritionRepository~~ ✅
- ~~`getAllMeals()` and `getMealsByDate()` fetch meals, then loop N times to fetch food items per meal~~
- **Status:** Done — replaced N+1 loops with batch `SELECT ... WHERE meal_id IN (...)` + `groupFoodsByMealId()` helper. Now 2 queries instead of N+1.

### 26. ~~Optimize streak calculation in habitRepository~~ ✅
- ~~`getStreak()` runs an infinite loop querying one day at a time~~
- **Status:** Done — replaced N-query loop with single `SELECT date ... ORDER BY date DESC` query + JS consecutive counting. 1 query regardless of streak length.

### 27. ~~Add error state UI to nutrition and journal screens~~ ✅
- ~~Nutrition screen has no error display — if loading fails, user sees nothing~~
- **Status:** Done — added dismissable error banners to nutrition and journal screens. Both destructure `error` + `clearError` from store and show a tappable banner when errors occur.

### 28. ~~Add SafeAreaView to modal overlays~~ ✅
- ~~All tab screen modals (habits, sleep, exercise, nutrition, journal) use View instead of SafeAreaView~~
- **Status:** Done — added `useSafeAreaInsets()` to all 5 tab screens. Modal content uses `Math.max(spacing.xxl, insets.bottom + spacing.md)` for bottom padding. 6 modal views updated across 5 files.

### 29. ~~Use centralized constant for OCR max_tokens + fix camera ref types~~ ✅
- ~~`handwritingOCR.ts` used hardcoded `4096` instead of a constant. Camera refs in `camera.tsx` and `scan.tsx` typed as `any`.~~
- **Status:** Done — added `AI_OCR_MAX_TOKENS` constant, typed camera refs as `CameraView`.

### 30. ~~Add KeyboardAvoidingView to form modals~~ ✅
- ~~All tab screen modals (habits, sleep, exercise, nutrition, journal) lack `KeyboardAvoidingView` — keyboard covers inputs on iOS.~~
- **Status:** Done — wrapped all 5 tab screen modals with `KeyboardAvoidingView` (behavior: padding on iOS, height on Android).

### 31. ~~Add React Error Boundary component~~ ✅
- ~~No error boundary exists anywhere. A crash in any component takes down the whole app.~~
- **Status:** Done — created `ErrorBoundary` in `src/components/ui/` with retry button. Wraps root layout in `_layout.tsx`.

### 56. ~~Optimize N+1 streak loading in habits screen~~ ✅
- ~~`loadStreaks()` in `habits.tsx` loops over all habits calling `getStreak(habitId)` one at a time (N queries).~~
- **Status:** Done — added `getAllStreaks(habitIds)` to habitRepository that fetches all completions in a single query. Streaks computed in JS. Wired through store's `getAllStreaks()` method.

### 57. ~~Add date navigation to sleep screen~~ ✅
- ~~Nutrition and habits screens have `DateNavigator` for browsing past dates, but sleep screen still only shows all entries in a flat list.~~
- **Status:** Done — added `DateNavigator` to sleep screen. Shows single sleep entry for selected date or empty state. 7-day summary card adapts to the selected date window.

### 58. ~~Add date navigation to exercise screen~~ ✅
- ~~Exercise is the only tab screen without `DateNavigator`. Habits, nutrition, and sleep all have date browsing.~~
- **Status:** Done — added `DateNavigator` to exercise screen. Shows workouts for selected date with 7-day summary window. All 4 data tab screens now have consistent date navigation.

### 59. ~~Extract reusable FAB component~~ ✅
- ~~All 5 tab screens define identical FAB styles.~~
- **Status:** Done — created `FAB`, `SecondaryFAB`, and `FABGroup` components in `src/components/ui/`. All 5 tab screens updated to use shared components. ~100 lines of duplicate styles removed.

### 61. ~~Add error banners to habits, sleep, and exercise screens~~ ✅
- ~~Only nutrition and journal had dismissable error banners. Habits, sleep, and exercise screens silently swallowed store errors.~~
- **Status:** Done — all 5 tab screens now consistently show dismissable error banners when store errors occur.

### 62. ~~Add skeleton loading to all data screens~~ ✅
- ~~Dashboard had `SkeletonCard` loading but habits, sleep, exercise, nutrition, and journal screens showed blank/empty states while loading.~~
- **Status:** Done — all 5 data tab screens now show shimmer skeleton placeholders during initial data load. Uses existing `SkeletonCard` component from `src/components/ui/animations/`.

### 63. ~~Add journal and goals store tests~~ ✅
- ~~Only 4 of 8 stores have tests. `journalStore` and `goalsStore` are untested.~~
- **Status:** Done — journalStore (17 tests): CRUD, search, scanning, tags, error handling. goalsStore (10 tests): AsyncStorage load/save, defaults, partial updates, error resilience. 158 total tests passing.

### ~~64. Extract reusable ErrorBanner component~~ ✅
- **Status:** Done — created `ErrorBanner` component in `src/components/ui/`.

### 65. ~~Clean up unused imports after ErrorBanner and style extraction~~ ✅
- ~~After extracting ErrorBanner and removing duplicate styles, some screens may have unused imports (`borderRadius` from theme, etc.).~~
- **Status:** Done — removed unused `borderRadius` import from nutrition.tsx. 0 ESLint errors, 0 warnings.

### 66. ~~Add error handling to dashboard screen~~ ✅
- ~~Dashboard loads data from 4+ stores (habits, sleep, exercise, nutrition) but doesn't display errors from any of them.~~
- **Status:** Done — dashboard now shows `ErrorBanner` when any of the 5 stores has an error. Dismissing clears all store errors.

### 67. ~~Add dashboard unit tests~~ ✅
- ~~Dashboard (`app/(tabs)/index.tsx`) has zero test coverage.~~
- **Status:** Done — 8 tests covering card rendering, habit progress, empty states, error banner, demo section, data loading. 166 total tests passing.

### 68. ~~Add SkeletonCard to ui barrel export~~ ✅
- ~~`SkeletonCard` re-exported indirectly via `export * from './animations'`.~~
- **Status:** Done — replaced wildcard export with explicit named exports (`Skeleton`, `SkeletonCard`) for discoverability.

### 69. ~~Add pull-to-refresh test for dashboard~~ ✅
- ~~Dashboard tests didn't cover refresh or demo data loading.~~
- **Status:** Done — expanded dashboard tests to 13 tests covering nutrition display, exercise stats, journal count, demo data loading, and multi-store error display. 171 total tests passing.

### 70. ~~Add loading spinner suppression for dashboard trend data~~ ✅
- ~~Trend data loads silently in background.~~
- **Status:** Not needed — WeeklyInsights already gracefully degrades to today's data as fallback when trend data is null. Streak badge only renders when > 0. No blank space or loading issue.

### 73. ~~Add edit functionality to sleep and exercise entries~~ ✅
- Users can create and delete entries but cannot edit existing ones. Long-press shows delete only.
- **Status:** Done — tap on sleep entry or exercise session card opens the log modal with pre-filled values. Modals detect edit mode and call `updateEntry`/`updateSession` instead of create. Titles and button text update dynamically ("Edit Sleep" / "Edit Exercise").

### 74. ~~Memoize dashboard computed values~~ ✅
- ~~Dashboard computed values re-calculated on every render.~~
- **Status:** Done — wrapped `completedHabits`, `todaySleep`, `todayExercise`, `totalExerciseMinutes`, `todayJournalCount` in `useMemo`.

### 75. ~~Add tap-to-navigate from dashboard cards to specific date~~ ✅
- Dashboard cards navigate to tab screens but don't pass the current date context.
- **Status:** Not needed — dashboard always shows today's data, and tab screens default to today via `getDateString()`. Tabs persist state across navigation, so users benefit from remembering their last-viewed date when switching between tabs.

### 78. ~~Log modals always create entries for today, ignoring DateNavigator selection~~ ✅
- ExerciseLogModal, NutritionLogModal, and SleepLogModal all hardcoded `getDateString()` (today) when creating new entries.
- **Status:** Done — added `date` prop to all 3 modals. Parent screens pass `selectedDate`. Modals fall back to `getDateString()` when no date prop is provided.

### 79. ~~Nutrition camera hardcodes meal type as 'snack'~~ ✅
- `app/nutrition/camera.tsx` always set `mealType: 'snack'` with no way to change it.
- **Status:** Done — added meal type selector (breakfast/lunch/dinner/snack) to the results card. Defaults to lunch. Uses `MEAL_TYPE_LABELS` for consistency.

### 80. ~~Redundant full re-fetch on every date change~~ ✅
- Exercise and sleep screens called `loadSessions()`/`loadEntries()` (full re-fetch) on every date change, even though the data was already in Zustand state from the initial load.
- **Status:** Done — removed redundant re-fetch from `handleDateChange` in exercise.tsx and sleep.tsx. `useMemo` already filters from in-memory state. Initial load fetches all records once; pull-to-refresh handles forced reloads. SQLite handles local data volumes efficiently.

### 83. ~~Add data export service tests~~ ✅
- `dataExport.ts` handles JSON/CSV export and sharing with no test coverage.
- **Status:** Done — 10 tests covering JSON export, CSV generation (all 5 types), sharing availability check, error path. 237 total tests.

### 82. ~~Add aiInsightsStore tests~~ ✅
- Only untested Zustand store. Handles 6 AI service calls with loading states, caching, and error handling.
- **Status:** Done — 12 tests covering all 6 fetch methods, caching logic, generic error fallback, and clearAll reset. 227 total tests passing.

### 92. ~~Add edit functionality to nutrition and journal entries~~ ✅
- Users could create and delete meals/journal entries but not edit them. Sleep and exercise already had edit support (TODO #73).
- **Status:** Done — tap on meal card opens NutritionLogModal pre-filled with meal type, name, calories. Tap on journal entry card opens JournalEntryModal pre-filled with title, content, mood. Both modals detect edit mode and call `updateMeal`/`updateEntry` instead of create. Titles and button text update dynamically.

### 90. ~~Fix exercise calorie estimation key mismatch~~ ✅
- `estimateCalories()` used `weights` key but exercise type ID is `weight_training`, causing wrong calorie estimate (6 default instead of 5 cal/min).
- **Status:** Done — changed `weights` to `weight_training` in `baseCaloriesPerMinute` lookup.

### 91. ~~Fix N+1 query in healthInsightsAI gatherHealthData~~ ✅
- `gatherHealthData()` called `getCompletionsForHabit()` in a loop for each habit (N+1 pattern).
- **Status:** Done — replaced with single `getCompletionsForDateRange()` call + JS filter. Same pattern already used in `healthInsights.ts`.

### 89. ~~Add healthInsightsAI service tests~~ ✅
- All 6 AI functions (`generateDailyCoaching`, `generateHabitSuggestions`, `analyzeSleepPatterns`, `getExerciseRecommendation`, `analyzeJournalMood`, `getNutritionAdvice`) had no test coverage.
- **Status:** Done — 13 tests covering API response parsing, JSON fallback defaults, non-text response error. 300 total tests.

### 88. ~~Add imagePersist and constants utility tests~~ ✅
- `imagePersist.ts` and `getQualityColor()` in `constants.ts` had no test coverage.
- **Status:** Done — imagePersist (4 tests): copy, dir creation, skip if exists, fallback on error. constants (6 tests): all 5 quality levels + out-of-range default. 287 total tests.

### 86. ~~Add handwritingOCR service tests~~ ✅
- Only AI service file without tests (foodRecognition had 6 tests).
- **Status:** Done — 9 tests covering transcription, confidence levels (high/medium/low/missing), timeout, non-text response, media type detection, multiline text preservation. 266 total tests.

### 87. ~~Add Claude client tests~~ ✅
- Core API infrastructure (key storage, client singleton, error handling) was untested.
- **Status:** Done — 11 tests covering secure storage read/write/delete, hasApiKey, client creation, singleton caching, missing key error. 277 total tests.

### 84. ~~DRY up nutritionRepository food-loading duplication~~ ✅
- `getAllMeals`, `getMealsByDate`, `getMealsByDateRange` had identical 8-line food-loading blocks.
- **Status:** Done — extracted `attachFoodsToMeals()` helper. 3 methods now each call the shared helper.

### 85. ~~Add nutritionRepository tests~~ ✅
- Only repository without dedicated tests (habit, sleep, exercise, journal all covered).
- **Status:** Done — 20 tests covering getAllMeals, getMealById, getMealsByDate, getMealsByDateRange, createMeal, updateMeal, deleteMeal, getDailyTotals, recalculateMealTotals, food item CRUD, null→undefined mapping, AI analysis JSON serialization. 257 total tests.

### 81. ~~Add repository tests for sleep, exercise, and journal repos~~ ✅
- Only `habitRepository` had tests. Other 3 repositories were untested.
- **Status:** Done — sleepRepository (14 tests), exerciseRepository (14 tests), journalRepository (15 tests). Covers CRUD, date range queries, aggregates, search, tag deduplication. 215 total tests passing.

### 77. ~~Sleep modal date is always "today" when editing past entries~~ ✅
- `SleepLogModal` reconstructed bedtime/wakeTime using today's date even when editing past entries.
- **Status:** Done — uses `parseISO(editEntry.date)` as reference when editing, preserving the original entry's date context.

### 71. ~~Memoize filtered/mapped lists in tab screens~~ ✅
- ~~Multiple tab screens filter data on every render without `useMemo`.~~
- **Status:** Done — wrapped `dateEntry`/`weekEntries` in sleep, `dateSessions`/`weekSessions` in exercise, and `dateMeals`/`isViewingToday` in nutrition with `useMemo`.

### 72. ~~Fix dashboard test act() warnings~~ ✅
- ~~Dashboard tests threw `act()` warnings from async state updates.~~
- **Status:** Done — refactored tests with `renderDashboard()` helper that awaits all async effects. Added streak badge test. 14 dashboard tests, 172 total, zero warnings.

### 60. ~~Add pull-to-refresh on date change for sleep and exercise~~ ✅
- ~~Sleep and exercise screens didn't re-fetch when navigating dates.~~
- **Status:** Done — `handleDateChange` now calls `loadEntries()`/`loadSessions()` on both screens, consistent with habits and nutrition.

### ~~32. Refactor large tab screen components (500+ lines)~~ ✅
- `nutrition.tsx` (680 lines), `settings.tsx` (673 lines), `sleep.tsx` (657 lines), `journal.tsx` (623 lines), `exercise.tsx` (585 lines), `habits.tsx` (550 lines) all exceed the 200-line guideline.
- Extract modal content, form sections, and list items into dedicated components.
- **Effort:** ~4-6h (all screens)

### 33. ~~Add API timeout protection for Claude AI calls~~ ✅
- ~~`foodRecognition.ts`, `handwritingOCR.ts`, and `healthInsightsAI.ts` had no request timeout.~~
- **Status:** Done — all 8 API calls now use `Promise.race()` with `AI_TIMEOUT_MS` (30s). Also replaced 6 hardcoded model names in `healthInsightsAI.ts` with `AI_MODEL` constant.

### 34. ~~Add unit tests for AI service timeout behavior~~ ✅
- ~~Timeout was added to all Claude API calls but no tests verify the timeout logic fires correctly.~~
- **Status:** Done — 6 tests for `foodRecognition`: success, timeout, non-text response, invalid JSON, schema validation failure, macro mapping.

### 35. ~~Add input validation for numeric form fields~~ ✅
- ~~Sleep time inputs accept any text, nutrition calories has no positive number validation, exercise duration allows zero.~~
- **Status:** Done — sleep validates hours (0-23) and minutes (0-59), exercise validates duration > 0 and calories > 0, nutrition validates calories > 0. All show Alert on invalid input.

### 36. Refactor large tab screen components (500+ lines) — In Progress
- ~~`nutrition.tsx` (690 → 306 lines)~~ ✅ Extracted `NutritionLogModal` component.
- ~~`journal.tsx` (629 → 257 lines)~~ ✅ Extracted `JournalEntryModal` component.
- ~~`sleep.tsx` (677 → 451 lines)~~ ✅ Extracted `SleepLogModal` component.
- ~~`exercise.tsx` (600 → 391 lines)~~ ✅ Extracted `ExerciseLogModal` component.
- ~~`habits.tsx` (555 → 316 lines)~~ ✅ Extracted `CreateHabitModal` + `HabitSuggestionsModal` components.
- `settings.tsx` (673 lines) — already well-structured with `SettingRow` and `ThemePicker` helper components. No modals to extract; handler methods share state so further splitting adds fragmentation without benefit.
- **Status:** Done — 5 of 6 screens refactored. settings.tsx kept as-is (already clean architecture).

### 37. ~~Add barrel exports for new component subdirectories~~ ✅
- ~~`src/components/sleep/`, `exercise/`, `journal/`, `nutrition/` lack `index.ts` barrel exports.~~
- **Status:** Done — created `index.ts` in all 4 directories, updated imports in tab screens to use barrel exports.

### 38. ~~Extract duplicate `getQualityColor()` into shared utility~~ ✅
- ~~`app/(tabs)/sleep.tsx` and `src/components/sleep/SleepLogModal.tsx` both define `getQualityColor()` with identical logic but different signatures.~~
- **Status:** Done — extracted to `src/utils/constants.ts` as `getQualityColor(quality, colors)`. Both files now import the shared function.

### 39. ~~Replace hardcoded `#FFFFFF` with `colors.white` in extracted modals~~ ✅
- ~~11 instances of hardcoded `'#FFFFFF'` across newly extracted modal components and other UI files.~~
- **Status:** Done — replaced inline `#FFFFFF` with `colors.white` in 8 component files. Static StyleSheet values kept as-is (can't reference theme).

### 40. ~~Add tests for extracted modal components~~ ✅
- ~~Newly extracted modals (SleepLogModal, ExerciseLogModal, JournalEntryModal, NutritionLogModal, CreateHabitModal, HabitSuggestionsModal) have no test coverage.~~
- **Status:** Done — added tests for all 5 extracted modal components: CreateHabitModal (5 tests), SleepLogModal (6 tests), ExerciseLogModal (6 tests), NutritionLogModal (8 tests), JournalEntryModal (9 tests). Tests cover rendering, form submission, validation, edit mode, and mode toggles. 317 total tests passing.

### 41. ~~Fix ErrorBoundary hardcoded colors and console.error~~ ✅
- ~~`src/components/ui/ErrorBoundary.tsx` uses hardcoded hex colors (#F8F9FA, #1A1A2E, #6366F1) in StyleSheet — breaks dark mode.~~
- **Status:** Done — replaced hardcoded colors with dynamic theme colors using `Appearance.getColorScheme()` + `lightColors`/`darkColors`. Wrapped `console.error` in `__DEV__` check. Moved colors from static StyleSheet to inline styles.

### 42. ~~Add explicit radix to parseInt() calls~~ ✅
- ~~`SleepLogModal.tsx` lines 41-44 call `parseInt()` without radix parameter.~~
- **Status:** Done — added explicit radix `10` to all 7 parseInt() calls across SleepLogModal (4), ExerciseLogModal (2), and NutritionLogModal (1).

### 43. ~~Fix mock auth service .then() pattern~~ ✅
- ~~`src/services/auth/mockAuthService.ts` line 46 uses `.then()` instead of async/await.~~
- **Status:** Done — replaced `.then()` callback with async/await IIFE pattern in `onAuthStateChange()`.

### 44. ~~Optimize getDailyStreak() — unbounded loop with repeated full-table fetches~~ ✅
- ~~`src/services/insights/healthInsights.ts` getDailyStreak() runs `while(true)` calling `.getAll()` on sleep, exercise, and nutrition repos **every iteration**~~
- **Status:** Done — fetches all data once with `Promise.all()`, builds a `Set` of active dates, then iterates in JS. 3 queries total regardless of streak length.

### 45. ~~Fix hardcoded export version string~~ ✅
- ~~`src/services/export/dataExport.ts` line 40 hardcodes `'1.6.0'` but package.json says `1.0.0`~~
- **Status:** Done — replaced with `Constants.expoConfig?.version ?? '1.0.0'`.

### 47. ~~Add journal search and tag display~~ ✅
- ~~Journal store has `search()` and `getAllTags()` methods but no UI calls them. Tags stored but never displayed.~~
- **Status:** Done — added search bar to journal screen (filters entries via `journalRepository.search()`). Added tag badges on journal entry cards.

### 48. ~~Add long-press delete to all data screens~~ ✅
- ~~Exercise, nutrition, sleep, and journal cards have no way to delete entries from the list screen.~~
- **Status:** Done — added `onLongPress` prop to `AnimatedCard`, wired up delete handlers on all 4 screens (exercise, nutrition, sleep, journal) with Alert confirmation + haptic feedback. Daily totals refresh after meal deletion.

### 54. ~~Add tag filter to journal screen~~ ✅
- ~~Journal entries display tags but there's no way to filter by tag.~~
- **Status:** Done — added horizontal scrollable tag filter pills below the search bar. Tapping a tag toggles filtering; tapping again clears filter. Tags are derived from loaded entries via `useMemo`. Works in combination with text search.

### 53. ~~Add summary cards to sleep and exercise screens~~ ✅
- ~~Sleep and exercise screens show raw entries but no aggregated stats.~~
- **Status:** Done — sleep shows 7-day average duration, quality, and nights tracked. Exercise shows total workouts, total time, and total calories burned. Also removed unused `getWeekDates()` from date utils.

### 55. ~~Add weekly completion dots to habit cards~~ ✅
- ~~Habits screen showed streak number but no visual history of recent completions.~~
- **Status:** Done — added 7 colored dots below each habit name showing the last 7 days of completions. Uses batch `getCompletionsForDateRange()` from habitRepository. Dots update when date navigates.

### 51. ~~Add date navigation to nutrition and habits screens~~ ✅
- ~~Users could only view today's data. No way to browse past dates or check off forgotten habits.~~
- **Status:** Done — created reusable `DateNavigator` component (left/right arrows + tap to return to today). Added to nutrition screen (browse meals/totals) and habits screen (toggle completions for past dates). Extended `loadTodayCompletions()` and `toggleCompletion()` to accept date parameter.

### 50. ~~Show daily streak on dashboard~~ ✅
- ~~`getDailyStreak()` was optimized (TODO #44) but never displayed in any UI.~~
- **Status:** Done — added streak badge next to date label on dashboard. Shows flame icon + "X days" when streak > 0. Fetched in parallel with trend data via `Promise.all()`.

### 49. ~~Fix empty Privacy Policy handler in settings~~ ✅
- ~~Privacy Policy button in settings had an empty `onPress={() => {}}` — clicking did nothing.~~
- **Status:** Done — shows an alert explaining that all data is stored locally on device. AI features only send data when explicitly triggered.

### 46. ~~Optimize N+1 query in getWeeklyStats()~~ ✅
- ~~`src/services/insights/healthInsights.ts` getWeeklyStats() loops over all habits calling `getCompletionsForHabit()` once per habit~~
- **Status:** Done — replaced N+1 loop with batch `getCompletionsForDateRange()` + parallel `Promise.all()` for all 5 data sources. Added `getMealsByDateRange()` to nutritionRepository and `getCompletionsForDateRange()` to habitRepository.

### 99. ~~Fix index-based keys in dynamic lists~~ ✅
- 5 components use `key={index}` for dynamic lists where items could change order: AICoaching, QuickActions, WeeklyInsights, HabitSuggestionsModal, Skeleton.
- **Status:** Done — replaced with stable keys: `action.route`, `insight.label`, `${insight.category}-${insight.title}`, `suggestion.name`. Skeleton kept index keys (static array, never reorders).

### 100. ~~Add QuickActions component tests~~ ✅
- `src/components/dashboard/QuickActions.tsx` renders 4 navigation action cards with spring animations. Zero test coverage.
- **Status:** Done — 6 tests: all 4 labels, section title, navigation routes for all 4 actions. 343 total tests.

### 101. ~~Add WeeklyInsights component tests~~ ✅
- `src/components/dashboard/WeeklyInsights.tsx` calculates trend direction (positive/negative/neutral) with 5% threshold. Zero test coverage.
- **Status:** Done — 7 tests: title/subtitle, labels, values with units, positive/negative/neutral trends, zero previous value. 350 total tests.

### 102. ~~Add StreakBadge component tests~~ ✅
- `src/components/habits/StreakBadge.tsx` returns null when streak=0, maps 4 milestone thresholds to icons/labels. Zero test coverage.
- **Status:** Done — 7 tests: null for 0, streak numbers at various thresholds, label display at lg size, no label at md size. 357 total tests.

### 103. ~~Add StreakCelebration component tests~~ ✅
- `src/components/habits/StreakCelebration.tsx` only renders on milestone numbers (7,14,21,30,60,90,100,180,365). Zero test coverage.
- **Status:** Done — 8 tests: null for non-milestones, correct titles/messages for 7/30/100/365-day milestones, habit name display, close button. 365 total tests.

### 104. ~~Add HabitSuggestionsModal component tests~~ ✅
- `src/components/habits/HabitSuggestionsModal.tsx` shows AI-generated habit suggestions with loading/error states. Zero test coverage.
- **Status:** Done — 6 tests: modal title, loading state, empty state, suggestion cards, create habit, fetch suggestions. 371 total tests.

### 105. ~~Add AICoaching component tests~~ ✅
- `src/components/dashboard/AICoaching.tsx` (356 lines) — complex component with 4 render states: no API key, loading, error, coaching data. Zero test coverage.
- **Status:** Done — 7 tests: API key setup prompt, setup button callback, loading state, error state, coaching data with insights, daily tip/motivation, auto-fetch on mount. 378 total tests.

### 107. ~~Expand date utility test coverage~~ ✅
- `src/utils/date.ts` exports 11 functions but only 4 were tested.
- **Status:** Done — added tests for `formatDate` (3), `parseDate` (1), `getStartOfDay` (1), `getEndOfDay` (1), `getDurationMinutes` (2), `formatTime` (2), `getRelativeDateLabel` expanded (3 more), `generateId` (2). Date tests: 9 → 25. 393 total tests.

### 108. ~~Add ThemeContext tests~~ ✅
- `ThemeProvider` and `useTheme` hook had zero test coverage despite being used in every component.
- **Status:** Done — 8 tests: default system mode, light/dark switching, AsyncStorage persistence, saved mode loading, invalid mode handling, storage error resilience, useTheme-outside-provider error. 401 total tests.

### 106. ~~Replace hardcoded `#FFFFFF` in AICoaching setupButtonText style~~ ✅
- `src/components/dashboard/AICoaching.tsx` line 351: `color: '#FFFFFF'` in static StyleSheet.
- **Status:** Not needed — static `StyleSheet.create()` can't reference dynamic theme colors. White text on `colors.primary` button is correct regardless of theme.

### 109. ~~Extract estimateCalories utility from exercise log screen~~ ✅
- `app/exercise/log.tsx` had a 15-line inline `estimateCalories()` function with hardcoded calorie-per-minute lookup table.
- **Status:** Done — extracted to `src/utils/constants.ts` as shared `estimateCalories(type, durationMinutes, intensity)` function with `BASE_CALORIES_PER_MINUTE` lookup. Added 6 unit tests. 407 total tests.

### 110. ~~Fix 5 ESLint warnings in test files~~ ✅
- 4 `@typescript-eslint/no-require-imports` warnings in jest.mock factories (QuickActions, WeeklyInsights, AICoaching, HabitSuggestionsModal) + 1 unused `queryByText` in EmptyState test.
- **Status:** Done — added eslint-disable comments for necessary require() in jest.mock (standard pattern), removed unused destructured variable. 0 ESLint errors, 0 warnings.

### 111. ~~Extract shared withTimeout utility for AI services~~ ✅
- 3 AI service files (healthInsightsAI, foodRecognition, handwritingOCR) had identical Promise.race + setTimeout timeout pattern.
- **Status:** Done — extracted `withTimeout<T>(promise, message)` to `src/utils/constants.ts`. All 3 services now import the shared utility. Added 3 tests. 410 total tests.

### 112. ~~Add authStore tests~~ ✅
- `authStore` was the last untested Zustand store. All 7 methods untested.
- **Status:** Done — 14 tests covering initialize, signUp/signIn (success + error), signInWithGoogle, signOut (success + error), sendVerificationEmail, sendPasswordReset, reloadUser (success + silent fail), clearError. 424 total tests.

### 113. ~~Add AnimatedButton component tests~~ ✅
- AnimatedButton (181 lines) with 4 variants, 3 sizes, loading/disabled states, haptic feedback. Zero test coverage.
- **Status:** Done — 7 tests: title rendering, onPress, loading hides title, disabled blocks press, icon rendering, haptic feedback on/off. 435 total tests.

### 114. ~~Add FAB component tests~~ ✅
- FAB, SecondaryFAB, and FABGroup components used across all 5 tab screens. Zero test coverage.
- **Status:** Done — 4 tests: FAB render + press, FAB grouped mode, SecondaryFAB render + press, FABGroup children. 435 total tests.

### 115. ~~Add AnimatedCard component tests~~ ✅
- AnimatedCard (127 lines) with 3 variants, pressable/non-pressable modes, haptic feedback, long press. Zero test coverage.
- **Status:** Done — 6 tests: children rendering, onPress, onLongPress, haptic on/off, static card mode. Also removed unused `AI_TIMEOUT_MS` export. 441 total tests.

### 116. ~~Add Skeleton and SkeletonCard component tests~~ ✅
- Skeleton shimmer animation and SkeletonCard loading placeholder used across all 5 data screens. Zero test coverage.
- **Status:** Done — 4 tests: dimension/percentage rendering, default and custom line counts. Also fixed redundant isDark ternaries in AnimatedCard/AnimatedButton. 445 total tests.

### 117. ~~Add ErrorBoundary component tests~~ ✅
- ErrorBoundary class component wrapping root layout. Zero test coverage.
- **Status:** Done — 5 tests: normal rendering, error catch + display, retry button, custom fallback, default error message. 450 total tests.

### 118. ~~Add mockAuthService tests~~ ✅
- `mockAuthService.ts` is the actual auth implementation used at runtime (mock Firebase). Zero test coverage.
- **Status:** Done — 11 tests: signUp, signIn, signInWithGoogle, signOut, onAuthStateChange (stored + null), sendVerificationEmail, sendPasswordReset, reloadUser, updateUserProfile, useGoogleAuth. 461 total tests.

### ~~119. Improve sleepStore test coverage (70% → 97%)~~ ✅
- ~~`sleepStore.ts` at 70.27% line coverage — lowest of all stores. Missing tests for updateEntry, deleteEntry error paths.~~
- **Status:** Done — added 4 tests (loadEntriesForRange error, updateEntry success/error, deleteEntry error). 16 total tests, 97.56% coverage.

### ~~120. Improve nutritionStore test coverage (75% → 85%+)~~
- ~~`nutritionStore.ts` at 74.64% line coverage. Missing tests for updateMeal, deleteMeal, addFoodItem, updateFoodItem, deleteFoodItem error paths.~~
- **Status:** Done — added 7 tests (loadMealsForDate error, createMeal sort, updateMeal success/error/totals-reload, deleteMeal error, addFoodItem error, deleteFoodItem error). 25 total tests, coverage improved significantly.
- **Effort:** ~30min

### 121. ~~Improve habitStore test coverage (75% → 95%+)~~ ✅
- `habitStore.ts` at 75% line coverage. Missing tests for updateHabit error, getAllStreaks, getWeeklyCompletions.
- **Status:** Done — added 3 tests (updateHabit error, getAllStreaks, getWeeklyCompletions) + strengthened deleteHabit error assertions. 22 total tests.

### 122. ~~Improve exerciseStore test coverage (85% → 95%+)~~ ✅
- `exerciseStore.ts` at 85.36% line coverage. Missing tests for loadSessionsForRange error, createSession sort, updateSession error, deleteSession error.
- **Status:** Done — added 4 tests (loadSessionsForRange error, createSession sort, updateSession error, deleteSession error). 17 total tests.

### 123. ~~Improve healthInsights test coverage (85% → 95%+)~~ ✅
- `healthInsights.ts` at 85.71% line coverage. Missing coverage for getTrend branches and meals in getDailyStreak.
- **Status:** Done — added 4 tests (meals toward streak, up/down/stable trend detection). 15 total tests.

### 124. ~~Improve journalStore test coverage (91% → 97%+)~~ ✅
- `journalStore.ts` at 91.66% line coverage. Missing tests for loadEntriesForRange error, loadEntriesForDate, updateEntry error.
- **Status:** Done — added 3 tests. 20 total tests.

### 125. ~~Improve authStore test coverage (86% → 97%+)~~ ✅
- `authStore.ts` at 86.66% line coverage. Missing tests for signInWithGoogle error, sendVerificationEmail error, sendPasswordReset error.
- **Status:** Done — added 3 tests. 17 total tests.

### 126. ~~Remove unused Expo dependencies~~ ✅
- `expo-blur`, `expo-crypto`, `expo-image-manipulator` were in package.json but never imported anywhere.
- **Status:** Done — removed 3 packages.

### 127. ~~Improve habitRepository test coverage (55% → 90%+)~~ ✅
- `habitRepository.ts` at 55.55% coverage — lowest of all repositories. Missing tests for update field branches, getAllCompletions, getCompletionsForHabit, getCompletionsForDateRange, getAllStreaks.
- **Status:** Done — added 7 tests (update all fields, getAllCompletions, getCompletionsForHabit, getCompletionsForDateRange, getAllStreaks empty/multi/zero). 21 total tests.

### 128. ~~Improve repository update field coverage across all 4 repos~~ ✅
- exerciseRepository (73%), sleepRepository (85%), journalRepository (85%), nutritionRepository (86%) all had uncovered update field branches.
- **Status:** Done — added "updates all optional fields" tests to exercise, sleep, journal, and nutrition repos. Also added multi-food grouping test for nutritionRepository. 502 total tests.

### 129. ~~Code quality quick wins~~ ✅
- `coverage/` directory not in .gitignore. Hardcoded App Store and support email URLs in settings.tsx. Generic error message in nutrition/camera.tsx.
- **Status:** Done — added `coverage/` to .gitignore, extracted `APP_LINKS` constant to constants.ts, replaced hardcoded URLs in settings.tsx, replaced generic error with `getErrorMessage()` in camera save handler.

### ~~130. Add aiInsightsStore error path coverage~~ ✅
- `aiInsightsStore.ts` at 91.66%. Lines 114, 127, 140 are uncovered — error paths for fetchSleepAnalysis, fetchExerciseRecommendation, and fetchMoodAnalysis.
- **Status:** Done — added 3 error tests. 15 total tests, 505 total tests passing.

### ~~131. Fix database init safety — partial initialization on migration failure~~ ✅
- `src/database/index.ts:getDatabase()` caches `db` before running migrations. If `runMigrations()` throws, the next call returns a partially initialized database (no schema applied).
- **Status:** Done — only cache `db` after migrations succeed. Uses local `database` variable, assigns to module-level `db` only after `runMigrations()` completes.

### ~~132. Add safe JSON.parse wrappers in repository mappers~~ ✅
- 4 repositories use bare `JSON.parse()` on stored data without try-catch. If a row has corrupted JSON (tags, factors, aiAnalysis), the entire query crashes.
- **Status:** Done — added `safeJsonParse<T>()` helper to journalRepository, sleepRepository, and nutritionRepository. Returns `undefined` on parse failure instead of crashing.

### ~~153. Nutrition screen ignores user's calorie goal from goalsStore~~ ✅
- `app/(tabs)/nutrition.tsx` uses hardcoded `DEFAULT_CALORIE_GOAL = 2000` instead of reading `goalsStore.goals.dailyCalories`.
- **Status:** Done — replaced hardcoded constant with `useGoalsStore().goals.dailyCalories`. Progress bar and target display now reflect user's configured goal.

### ~~154. aiInsightsStore uses non-standard error handling pattern~~ ✅
- All 6 catch blocks used `error instanceof Error ? error.message : 'Failed to ...'` instead of centralized `getErrorMessage()`.
- **Status:** Done — replaced all 6 instances with `getErrorMessage(error)`. Consistent with all other stores.

### ~~155. goals.tsx updateLocalGoal uses untyped string key~~ ✅
- `key: string` should be `key: keyof Goals` for type safety.
- **Status:** Done — exported `Goals` interface from goalsStore, typed key as `keyof Goals`.

### ~~156. goalsStore uses hardcoded storage key instead of STORAGE_KEYS constant~~ ✅
- `const STORAGE_KEY = 'trackr_goals'` should use `STORAGE_KEYS.GOALS` from constants.ts.
- **Status:** Done — removed local constant, imported `STORAGE_KEYS` from constants.

### ~~157. healthInsightsAI gatherHealthData fetches unbounded data from all tables~~ ✅
- `getAll()` on sleep, exercise, nutrition, and journal repos fetches entire tables, then filters to 7 days in JS.
- **Status:** Done — replaced 4 unbounded `getAll()` calls with `getByDateRange(weekAgo, today)` variants. Database now returns only the 7-day window instead of full table scans.

### ~~158. getDailyStreak() uses unbounded getAll() queries on 3 tables~~ ✅
- `healthInsights.ts` `getDailyStreak()` called `getAll()` on sleep, exercise, and nutrition repos — full table scans to count consecutive days.
- **Status:** Done — replaced with `getByDateRange()` / `getMealsByDateRange()` bounded to 90-day window. Sufficient for any realistic streak while preventing full table scans.

### ~~159. Extract reusable ModalHeader component from 5 modal components~~ ✅
- All 5 modals (CreateHabit, Sleep, Exercise, Nutrition, Journal) implement identical header layout: row with title + X close button.
- **Status:** Done — created `ModalHeader` component in `src/components/ui/`. Updated all 5 modals. Removed ~65 lines of duplicate styles and imports.

### ~~160. Extract default AI fallback constants from healthInsightsAI~~ ✅
- Each AI function has inline fallback objects for JSON parse failures. Extract to module-level constants for consistency and testability.
- **Status:** Done — extracted 6 fallback constants (DEFAULT_COACHING, DEFAULT_HABIT_SUGGESTIONS, DEFAULT_SLEEP_ANALYSIS, DEFAULT_EXERCISE_RECOMMENDATION, DEFAULT_MOOD_ANALYSIS, DEFAULT_NUTRITION_ADVICE). ~50 lines consolidated.

### ~~168. Extract useApiKeyExists hook — removes 5 copy-pasted patterns~~ ✅
- All 5 tab screens had identical `checkApiKey` function + `useState` + `useEffect` pattern.
- **Status:** Done — created `useApiKeyExists()` hook in `src/services/claude/client.ts`. Updated all 5 screens. Removed ~25 lines of duplicate code.

### ~~169. Replace hardcoded magic numbers with named constants~~ ✅
- `healthInsightsAI.ts` used hardcoded `max_tokens: 512` and `256` instead of named constants.
- All 5 tab screens used `paddingBottom: 100` magic number.
- **Status:** Done — added `AI_MAX_TOKENS_MEDIUM` (512), `AI_MAX_TOKENS_BRIEF` (256), `TAB_CONTENT_PADDING_BOTTOM` (100) to constants.ts. Updated healthInsightsAI (5 calls) and all 5 tab screens.

### ~~168. Extract useApiKeyExists hook — removes 5 copy-pasted functions~~ ✅
- All 5 tab screens (habits, sleep, exercise, nutrition, journal) had identical `checkApiKey` function + `useState` + `useEffect` pattern.
- **Status:** Done — created `useApiKeyExists()` hook in `src/services/claude/client.ts`. Replaced manual pattern in all 5 screens. Each screen drops from 7 lines to 1. Exported from barrel.

### ~~167. Code quality batch: stale date fix, DRY safeJsonParse, theme consistency~~ ✅
- Dashboard `loadAll` closed over stale `today` from mount — app staying open past midnight used wrong date on refresh.
- `safeJsonParse<T>` was copy-pasted in 3 repositories (sleep, journal, nutrition).
- 7 modals used hardcoded `rgba(0,0,0,0.5)` instead of `colors.overlay` from theme.
- `ThemeContext.tsx` defined `THEME_STORAGE_KEY` locally instead of importing `STORAGE_KEYS.THEME_MODE`.
- `sleep.tsx` had hardcoded `#FFFFFF` instead of `colors.white`.
- Unused `DateString` type alias in `types/index.ts`.
- **Status:** Done — fixed stale date, extracted safeJsonParse to `src/utils/date.ts`, updated 7 modals to use `colors.overlay`, unified theme storage key, fixed sleep color, removed dead type.

### ~~166. Fix missing exercise types in calorie estimation + edge case tests~~ ✅
- `BASE_CALORIES_PER_MINUTE` was missing sports, cardio, and stretching entries present in `EXERCISE_TYPE_LABELS` — these fell through to default 6 cal/min.
- habitStore `toggleCompletion` error path untested. mockAuthService `updateUserProfile` edge cases untested.
- **Status:** Done — added 3 missing exercise types (sports: 7, cardio: 9, stretching: 2). Added toggleCompletion error test. Added 2 updateUserProfile edge case tests. 578 total tests.

### ~~165. Improve healthInsightsAI branch coverage — non-text response tests~~ ✅
- `healthInsightsAI.ts` at 58% branch coverage. Lines 246, 295, 338, 387, 443 (non-text response guards) untested.
- **Status:** Done — added 5 non-text response tests for generateHabitSuggestions, analyzeSleepPatterns, getExerciseRecommendation, analyzeJournalMood, getNutritionAdvice. 100% statement/line/function coverage. 575 total tests.

### ~~164. Improve store branch coverage from 50% to 100%~~ ✅
- exerciseStore, sleepStore, journalStore, and nutritionStore had 50-56% branch coverage due to uncovered ternary branches in `.map()` calls and `if (meal)` null checks.
- **Status:** Done — added multi-item state tests to cover `.map()` ternary branches + null meal guard tests for nutritionStore. All 4 stores now at 100% branch coverage. 570 total tests.

### ~~163. Add ModalHeader tests + remove dead DEFAULT_CALORIE_GOAL constant~~ ✅
- New ModalHeader component had no tests. `DEFAULT_CALORIE_GOAL` constant unused after TODO #153 replaced it with `goalsStore.goals.dailyCalories`.
- **Status:** Done — 2 tests (title rendering, close callback). Removed unused constant from constants.ts.

### 161. ~~Extract duplicated image picker permission logic into shared utility~~
- `NutritionLogModal` and `JournalEntryModal` both implement identical camera/gallery permission request patterns with try-catch-alert.
- **Status:** Skipped — permission check is only 4 lines per call; the rest of each handler (image options, post-processing) is unique. Extraction would be over-engineering.

### ~~162. Consolidate food macro total calculations into single-pass~~ ✅
- `NutritionLogModal` runs 4 separate `.reduce()` calls for calories, protein, carbs, fat.
- **Status:** Done — replaced with single `for...of` loop. 1 pass instead of 4.

### ~~152. Improve AnimatedButton coverage — pressIn/pressOut, secondary variant, sizes~~ ✅
- `AnimatedButton.tsx` at 82.85% — missing pressIn/pressOut handler tests, secondary variant, sm/lg sizes.
- **Status:** Done — 4 new tests (pressIn/pressOut, secondary, sm, lg). 13 total tests.

### ~~151. Improve Dashboard coverage — navigation, refresh, error dismiss, demo error~~ ✅
- `app/(tabs)/index.tsx` at 76% — missing tests for card navigation (router.push), pull-to-refresh, error banner dismiss, demo data error path.
- **Status:** Done — 6 new tests (card navigation ×3, error dismiss, demo error, pull-to-refresh). 20 total tests, 560 total tests passing.

### ~~148. Improve JournalEntryModal coverage — gallery OCR flow + mode toggle + mood~~ ✅
- `JournalEntryModal.tsx` at 76.62% — missing gallery image OCR path, mode toggle press handlers, mood selection press handlers.
- **Status:** Done — 5 new tests (gallery OCR success, gallery OCR failure, gallery no API key, mode toggle switch, mood selection). 21 total tests.

### ~~149. Improve NutritionLogModal coverage — gallery analysis + meal type~~ ✅
- `NutritionLogModal.tsx` at 84.88% — missing gallery image analysis path, meal type selection press handler.
- **Status:** Done — 3 new tests (gallery analysis success, gallery analysis failure, meal type switch). 19 total tests.

### ~~150. Improve AnimatedCard coverage — variant styles + press events~~ ✅
- `AnimatedCard.tsx` at 84.37% — missing outlined/filled variant styles, pressIn/pressOut handlers.
- **Status:** Done — 3 new tests (outlined variant, filled variant, pressIn/pressOut). 9 total tests.

### ~~147. Add SleepLogModal edit mode and error tests~~ ✅
- `SleepLogModal.tsx` at 82.75% — missing tests for edit mode pre-fill, updateEntry path, save error handling, date reconstruction.
- **Effort:** ~20min

### ~~145. Improve ExerciseLogModal test coverage (78% → 90%+)~~ ✅
- Missing tests for edit mode save, save error path, calorie estimation triggers, duration format edge cases.
- **Effort:** ~30min

### ~~146. Improve CreateHabitModal test coverage (76% → 90%+)~~ ✅
- Missing tests for edit mode pre-fill, update path, save error handling, color selection.
- **Effort:** ~20min

### ~~143. Improve NutritionLogModal test coverage (51% → 80%+)~~ ✅
- `NutritionLogModal.tsx` at 51.16% — lowest coverage in the codebase. Missing tests for manual entry flow, edit mode, camera launch, save/error paths.
- **Effort:** ~45min

### ~~144. Improve JournalEntryModal test coverage (51% → 80%+)~~ ✅
- `JournalEntryModal.tsx` at 51.94% — second lowest coverage. Missing tests for edit mode, scan mode, OCR flow, tag management, save/error paths.
- **Effort:** ~45min

### ~~142. Wire fetchNutritionAdvice to nutrition screen~~ ✅
- `fetchNutritionAdvice()` exists in aiInsightsStore but is never called from UI.
- Follow the same pattern as journal/sleep AI analysis sections.
- **Effort:** ~30min

### ~~141. Wire fetchMoodAnalysis to journal screen~~ ✅
- `fetchMoodAnalysis()` and `fetchNutritionAdvice()` exist in aiInsightsStore but are never called from UI.
- Follow the same pattern as sleep screen's AI analysis section (trend, recommendations, refresh button).
- **Effort:** ~30min per screen

### ~~140. Add habit editing — tap to edit name and color~~ ✅
- `updateHabit()` existed in habitStore but was never called from UI. Users could create and delete habits but not edit them.
- **Status:** Done — tap on habit name/info opens CreateHabitModal in edit mode. Modal detects edit vs create, pre-fills name and color, calls `updateHabit()` on save. Added loading spinner to save button.

### ~~139. Add AnimatedButton ghost/danger variant tests~~ ✅
- AnimatedButton at 74% coverage — missing tests for ghost and danger variant rendering.
- **Status:** Done — added 2 tests for ghost and danger variants. 518 total tests, 91.4% overall statement coverage.

### ~~138. Improve DateNavigator test coverage (67% → 100%)~~ ✅
- Missing tests for goBack and goForward arrow press handlers.
- **Status:** Done — added 2 tests with testID-based arrow selection. Added testIDs to DateNavigator arrows. 516 total tests.

### ~~137. Add database initialization tests~~ ✅
- `src/database/index.ts` at 11% coverage — lowest file in the project. Tests database open, migration execution, caching, migration skip, failure safety, and close.
- **Status:** Done — 6 tests: open + run migrations, cached on second call, skip applied migrations, no cache on failure, closeDatabase, close no-op. 514 total tests.

### ~~136. Add loading spinner to sleep and exercise modal save buttons~~ ✅
- SleepLogModal and ExerciseLogModal were missing `loading` state on save buttons. NutritionLogModal and JournalEntryModal already had it.
- **Status:** Done — added `saving` state + `loading={saving}` prop to both modals. Users now see spinner feedback during save.

### ~~135. Replace generic error messages with getErrorMessage() in screen catch blocks~~ ✅
- 6 screen-level catch blocks used generic hardcoded error strings instead of `getErrorMessage(error)`.
- Files: `sleep/log.tsx`, `exercise/log.tsx`, `journal/new.tsx`, `journal/scan.tsx`, `settings.tsx` (2 locations).
- **Status:** Done — all 6 catch blocks now use `getErrorMessage(error)` for specific error feedback.

### ~~134. Add healthInsightsAI insufficient data branch tests~~ ✅
- `healthInsightsAI.ts` had 53% branch coverage due to untested early-return paths for insufficient data (sleep < 3, journal < 2, meals < 3).
- **Status:** Done — added 3 tests using `mockResolvedValueOnce` to override module-level mocks. Branch coverage improved. 508 total tests.

### ~~133. Fix silent store failures — add error state to swallowed catches~~ ✅
- `habitStore.toggleCompletion()` and `loadTodayCompletions()` fail silently — no error state set, no user feedback.
- `nutritionStore.loadDailyTotals()` also swallows errors silently.
- **Status:** Done — all 3 catch blocks now call `set({ error: getErrorMessage(error) })`. Updated tests to expect error state instead of null.

---

## Completed in This Audit

- [x] Removed dead `app/modal.tsx` and its Stack.Screen registration
- [x] Removed unused animation components (FadeIn, ScaleIn, StaggeredList)
- [x] Cleaned up animation and UI barrel exports
- [x] Verified `expo-file-system/legacy` imports are correct (legacy API bridge for Expo 54)
- [x] Removed `console.log`/`console.error` from dashboard
- [x] Fixed hardcoded version string in settings
- [x] Fixed `error: any` types in settings, camera, and scan screens
- [x] Removed unused npm packages: `react-native-chart-kit`, `victory-native`, `react-native-worklets`
- [x] Updated CLAUDE.md documentation
- [x] Set up Jest + React Native Testing Library with jest-expo preset (TODO #1)
- [x] Added initial tests: date utils (4 tests) and Button component (4 tests)
- [x] Set up ESLint (expo config + prettier), Prettier, Husky + lint-staged pre-commit hook (TODO #2)
- [x] Set up GitHub Actions CI pipeline with type-check + lint + test (TODO #8)
- [x] Added `/vibe` and `/merge` slash commands
- [x] Fixed all 14 ESLint errors across codebase - unescaped JSX entities + firebase import suppression (TODO #18)
- [x] Dark mode fixed on all screens - auth, onboarding, goals all use useTheme() + createStyles(colors) (TODO #4)
- [x] StreakBadge & StreakCelebration integrated into habits screen with milestone celebrations (TODO #5)
- [x] Audited colors imports - no direct `colors` imports from theme remain, all use `useTheme()` (TODO #9)
- [x] Fixed all 74 ESLint warnings: 54 unused vars removed, 19 exhaustive-deps resolved — 0 errors, 0 warnings (TODO #19)
- [x] Expanded test coverage: habitStore (19 tests), Card (3 tests), Input (5 tests) — 41 total tests (TODO #20)
- [x] Fixed catch (err: any) patterns in auth screens with proper unknown type narrowing (TODO #21)
- [x] Deep linking already configured: scheme "trackr" in app.json + Expo Router auto-handles routes (TODO #15)
- [x] Added sleep, nutrition, and exercise store tests: sleepStore (12), exerciseStore (12), nutritionStore (16) — 83 total tests (TODO #22)
- [x] Replaced 28 `(error as Error).message` with centralized `getErrorMessage()` across all 5 stores (TODO #23)
- [x] Migration system already exists: `migrations` table + `runMigrations()` in `src/database/index.ts` (TODO #13)
- [x] Added image persistence: `persistImage()` copies photos to permanent `documentDirectory/images/` before saving meals/journal entries (TODO #16)
- [x] Added habitRepository tests (13 tests) covering CRUD, completions, streak with mocked db — 96 total tests (TODO #24)
- [x] Fixed N+1 query in nutritionRepository: batch food item loading with IN clause (TODO #25)
- [x] Optimized streak calculation: single SQL query instead of N-query loop (TODO #26)
- [x] Added dismissable error banners to nutrition and journal screens (TODO #27)
- [x] Added safe area insets to all 6 modal overlays across 5 tab screens (TODO #28)
- [x] Added typed row interfaces to all 4 remaining repositories — zero `any` in repos (sleep, exercise, nutrition, journal)
- [x] Added saving state + loading spinner to nutrition camera Save Meal button
- [x] Eliminated all `any` types from src/ and app/ (ExportData, onboarding, QuickActions, healthInsightsAI) — only auth `as any` remains per user skip
- [x] Added `AI_OCR_MAX_TOKENS` constant, replaced hardcoded `4096` in handwritingOCR (TODO #29)
- [x] Typed camera refs as `CameraView` instead of `any` in nutrition/camera and journal/scan (TODO #29)
- [x] Added KeyboardAvoidingView to all 5 tab screen form modals — habits, sleep, exercise, nutrition, journal (TODO #30)
- [x] Created ErrorBoundary component in src/components/ui/ with retry button, wrapped root layout (TODO #31)
- [x] Added timeout protection (30s) to all 8 Claude API calls across 3 service files (TODO #33)
- [x] Replaced 6 hardcoded `claude-sonnet-4-20250514` model strings with `AI_MODEL` constant in healthInsightsAI.ts
- [x] Added 6 unit tests for foodRecognition service: success, timeout, error handling, schema validation (TODO #34)
- [x] Added input validation: sleep (0-23h, 0-59m), exercise (duration > 0, calories > 0), nutrition (calories > 0) (TODO #35)
- [x] Extracted NutritionLogModal from nutrition.tsx (690 → 306 lines) (TODO #36 partial)
- [x] Extracted JournalEntryModal from journal.tsx (629 → 257 lines) (TODO #36 partial)
- [x] Extracted SleepLogModal from sleep.tsx (677 → 451 lines) (TODO #36 partial)
- [x] Extracted ExerciseLogModal from exercise.tsx (600 → 391 lines) (TODO #36 partial)
- [x] Extracted CreateHabitModal + HabitSuggestionsModal from habits.tsx (555 → 316 lines) (TODO #36 partial)
- [x] Added barrel exports (index.ts) to sleep, exercise, journal, nutrition component dirs (TODO #37)
- [x] Extracted duplicate `getQualityColor()` into shared `constants.ts` utility (TODO #38)
- [x] Replaced inline `#FFFFFF` with `colors.white` in 8 component files (TODO #39)
- [x] Added modal component tests: CreateHabitModal (5), SleepLogModal (6), ExerciseLogModal (6) — 120 total tests (TODO #40)
- [x] Fixed ErrorBoundary: dynamic theme colors via Appearance API, wrapped console.error in __DEV__ (TODO #41)
- [x] Added explicit radix (10) to all 7 parseInt() calls across 3 modal components (TODO #42)
- [x] Replaced .then() with async/await in mockAuthService.onAuthStateChange() (TODO #43)
- [x] Optimized getDailyStreak(): fetch once + Set lookup instead of N×3 full-table fetches per day (TODO #44)
- [x] Fixed hardcoded export version '1.6.0' → Constants.expoConfig?.version (TODO #45)
- [x] Optimized getWeeklyStats(): batch queries via Promise.all() instead of N+1 per-habit loop (TODO #46)
- [x] Added `getCompletionsForDateRange()` to habitRepository and `getMealsByDateRange()` to nutritionRepository
- [x] Added healthInsights test suite (11 tests): weekly stats, daily streak, trend data — 131 total tests
- [x] Added journal search bar — filters entries via existing `journalRepository.search()` (TODO #47)
- [x] Added tag display on journal entry cards — shows tag badges below content (TODO #47)
- [x] Added long-press delete to all 4 data screens: exercise, nutrition, sleep, journal (TODO #48)
- [x] Fixed empty Privacy Policy handler — shows local storage info alert (TODO #49)
- [x] Added daily streak badge to dashboard header with flame icon (TODO #50)
- [x] Created DateNavigator component, added date browsing to nutrition and habits screens (TODO #51)
- [x] Added summary cards to sleep (avg duration/quality) and exercise (total workouts/time/calories) screens (TODO #53)
- [x] Added tag filter pills to journal screen — toggle filtering by tag (TODO #54)
- [x] Added weekly completion dots (7-day visual) to habit cards with batch loading (TODO #55)
- [x] Batch streak loading: single getAllStreaks() query replaces N sequential getStreak() calls (TODO #56)
- [x] Added date navigation to sleep screen with per-date view + 7-day summary (TODO #57)
- [x] Added date navigation to exercise screen — all 4 data tabs now have DateNavigator (TODO #58)
- [x] Extracted reusable FAB, SecondaryFAB, FABGroup components — removed ~100 lines of duplicate styles (TODO #59)
- [x] Added dismissable error banners to habits, sleep, and exercise screens (TODO #61)
- [x] Added skeleton loading states (SkeletonCard) to all 5 data tab screens (TODO #62)
- [x] Added journalStore (17 tests) and goalsStore (10 tests) — 158 total tests (TODO #63)
- [x] Extracted reusable ErrorBanner component — replaced inline banners in all 5 tab screens (TODO #64)
- [x] Removed unused `borderRadius` import from nutrition screen (TODO #65)
- [x] Added error banner to dashboard — aggregates errors from all 5 stores (TODO #66)
- [x] Removed unused `borderRadius` import from nutrition screen (TODO #65)
- [x] Replaced wildcard export with explicit named exports in ui barrel (TODO #68)
- [x] Added dashboard screen tests — 8 tests: cards, progress, errors, demo section, data loading (TODO #67)
- [x] Expanded dashboard tests to 13 — nutrition display, exercise stats, journal count, demo data (TODO #69)
- [x] Sleep and exercise screens now re-fetch data on date change (TODO #60)
- [x] Memoized filtered lists in sleep, exercise, and nutrition screens (TODO #71)
- [x] Fixed dashboard test act() warnings + added streak badge test — 14 dashboard tests, 172 total (TODO #72)
- [x] Memoized dashboard computed values with useMemo (TODO #74)
- [x] Added edit functionality to sleep and exercise — tap card opens pre-filled modal (TODO #73)
- [x] Fixed sleep modal date reconstruction when editing past entries (TODO #77)
- [x] Log modals now use selectedDate from DateNavigator instead of hardcoding today (TODO #78)
- [x] Added meal type selector to nutrition camera — no longer hardcodes 'snack' (TODO #79)
- [x] Removed redundant full data re-fetch from exercise/sleep date change handlers (TODO #80)
- [x] Added repository tests: sleepRepository (14), exerciseRepository (14), journalRepository (15) — 215 total tests (TODO #81)
- [x] Not needed — tabs already default to today, users benefit from persisted date state (TODO #75)
- [x] Removed false positive #76 — useEffect correctly fires on object reference change
- [x] Added aiInsightsStore tests (12 tests): caching, errors, all fetch methods (TODO #82)
- [x] Added data export service tests (10 tests): JSON/CSV export, sharing (TODO #83)
- [x] Replaced hardcoded #FFFFFF with colors.white in journal scan screen close button
- [x] DRY'd nutritionRepository — extracted attachFoodsToMeals() helper for 3 methods (TODO #84)
- [x] Added nutritionRepository tests (20 tests): CRUD, totals, food items, JSON serialization — 257 total tests (TODO #85)
- [x] Added handwritingOCR tests (9 tests): transcription, confidence levels, timeout, media types (TODO #86)
- [x] Added Claude client tests (11 tests): key storage, singleton, error handling — 277 total tests (TODO #87)
- [x] Added imagePersist tests (4) and getQualityColor tests (6) — 287 total tests (TODO #88)
- [x] Added healthInsightsAI tests (13): all 6 AI functions, JSON parsing, fallback defaults — 300 total tests (TODO #89)
- [x] Fixed exercise calorie estimation: `weights` → `weight_training` key mismatch (TODO #90)
- [x] Replaced N+1 habit completion queries with batch `getCompletionsForDateRange()` in healthInsightsAI (TODO #91)
- [x] Added edit functionality to nutrition and journal — tap card opens pre-filled modal (TODO #92)
- [x] Added NutritionLogModal tests (8) and JournalEntryModal tests (9) — 317 total tests (TODO #40 expanded)
- [x] Improved foodRecognition JSON parsing — try direct parse first, regex fallback (TODO #93)
- [x] Added try-catch to all 6 modal save handlers with error alerts (TODO #94)
- [x] Memoized AICoaching category/priority lookups with useMemo (TODO #95)
- [x] Added habitReminders tests (10): permissions, scheduling, cancellation, filtering, listeners — 328 total tests (TODO #96)
- [x] Added ErrorBanner (2) and DateNavigator (4) UI component tests — 334 total tests (TODO #97)
- [x] Extracted reusable EmptyState component — replaced inline patterns in all 5 tab screens (TODO #98)
- [x] Added EmptyState tests (3) + used HABIT_COLORS constant in demoData.ts — 337 total tests
- [x] Extracted estimateCalories to constants.ts + 6 tests — 407 total tests (TODO #109)
- [x] Fixed 5 ESLint warnings in test files — 0 errors, 0 warnings (TODO #110)
- [x] Extracted shared withTimeout utility + 3 tests — 410 total tests (TODO #111)
- [x] Added authStore tests (14 tests) — 424 total tests (TODO #112)
- [x] Added AnimatedButton (7) and FAB (4) component tests — 435 total tests (TODO #113-114)
- [x] Added AnimatedCard tests (6) + removed unused AI_TIMEOUT_MS export — 441 total tests (TODO #115)
- [x] Fixed redundant isDark ternaries in AnimatedCard and AnimatedButton + removed unused isDark
- [x] Added Skeleton (2) and SkeletonCard (2) tests — 445 total tests (TODO #116)
- [x] Added ErrorBoundary tests (5) — 450 total tests (TODO #117)
- [x] Added mockAuthService tests (11) — 461 total tests (TODO #118)
- [x] Replaced hardcoded Skeleton colors with theme tokens (borderLight, shimmer)
- [x] Fixed remaining ESLint warnings — 0 errors, 0 warnings
- [x] Improved sleepStore coverage from 70% to 97% — 4 new tests, 16 total (TODO #119)
- [x] Improved nutritionStore coverage — 7 new tests (error paths + sort + updateMeal), 25 total — 473 total tests (TODO #120)
- [x] Improved habitStore coverage from 75% to 95%+ — 3 new tests (updateHabit error, getAllStreaks, getWeeklyCompletions), 22 total (TODO #121)
- [x] Improved exerciseStore coverage from 85% to 95%+ — 4 new tests (error paths + sort), 17 total — 480 total tests (TODO #122)
- [x] Improved healthInsights coverage — 4 new tests (trend detection + meals streak), 15 total (TODO #123)
- [x] Improved journalStore coverage — 3 new tests (error paths + loadEntriesForDate), 20 total (TODO #124)
- [x] Improved authStore coverage — 3 new tests (signInWithGoogle/sendVerification/sendPasswordReset errors), 17 total — 490 total tests (TODO #125)
- [x] Removed unused deps: expo-blur, expo-crypto, expo-image-manipulator (TODO #126)
- [x] Improved habitRepository coverage from 55% to 90%+ — 7 new tests (update fields, completions, streaks), 21 total — 497 total tests (TODO #127)
- [x] Improved all 4 repository update field coverage — exercise, sleep, journal, nutrition repos + multi-food grouping test — 502 total tests (TODO #128)
- [x] Added coverage/ to .gitignore, extracted APP_LINKS constant, fixed generic error in camera save (TODO #129)
- [x] Added aiInsightsStore error tests for sleep/exercise/mood — 505 total tests (TODO #130)
- [x] Fixed database init safety — only cache db after migrations succeed (TODO #131)
- [x] Added safeJsonParse wrappers to journal, sleep, and nutrition repositories (TODO #132)
- [x] Fixed silent store failures — habitStore and nutritionStore now set error state (TODO #133)
- [x] Added healthInsightsAI insufficient data tests (sleep/journal/nutrition) — 508 total tests (TODO #134)
- [x] Replaced generic error messages with getErrorMessage() in 6 screen catch blocks (TODO #135)
- [x] Added loading spinner to sleep and exercise modal save buttons (TODO #136)
- [x] Added database initialization tests (6 tests): open, cache, migration skip, failure safety, close — 514 total tests (TODO #137)
- [x] Added DateNavigator arrow navigation tests + testIDs — 516 total tests (TODO #138)
- [x] Added AnimatedButton ghost/danger variant tests — 518 total tests (TODO #139)
- [x] Added habit editing — tap habit name opens edit modal with pre-filled name/color (TODO #140)
- [x] Wired fetchMoodAnalysis to journal screen — AI mood analysis card with trend, themes, suggestions (TODO #141)
- [x] Wired fetchNutritionAdvice to nutrition screen — AI advice card with suggestions and refresh (TODO #142)
- [x] Improved NutritionLogModal coverage from 51% to ~80% — 7 new tests (camera/gallery permissions, AI analysis, detected foods save, error paths, edit mode save) — 525 total tests (TODO #143)
- [x] Improved JournalEntryModal coverage from 51% to ~80% — 7 new tests (camera/library permissions, OCR scan, scan fail, no API key, save error, edit mode update) — 532 total tests (TODO #144)
- [x] Improved ExerciseLogModal coverage from 78% to ~90% — 4 new tests (invalid calories, edit mode pre-fill, updateSession, save error) — 536 total tests (TODO #145)
- [x] Improved CreateHabitModal coverage from 76% to ~90% — 3 new tests (edit mode pre-fill, updateHabit, save error) — 539 total tests (TODO #146)
- [x] Improved SleepLogModal coverage from 82% to ~90% — 4 new tests (invalid wake time, edit mode pre-fill, updateEntry, save error) — 543 total tests (TODO #147)
- [x] Improved JournalEntryModal coverage from 76% to ~90% — 5 new tests (gallery OCR success/failure/no-api-key, mode toggle, mood selection) — 548 total tests (TODO #148)
- [x] Improved NutritionLogModal coverage from 84% to ~90% — 3 new tests (gallery analysis success/failure, meal type switch) — 551 total tests (TODO #149)
- [x] Improved AnimatedCard coverage from 84% to ~90% — 3 new tests (outlined/filled variants, pressIn/pressOut events) — 554 total tests (TODO #150)
- [x] Improved Dashboard coverage from 76% to ~90% — 6 new tests (card navigation, error dismiss, demo error, pull-to-refresh) — 560 total tests (TODO #151)
- [x] Improved AnimatedButton coverage from 82% to ~90% — 4 new tests (pressIn/pressOut, secondary variant, sizes) — 564 total tests (TODO #152)
- [x] Fixed nutrition calorie goal to use goalsStore instead of hardcoded constant (TODO #153)
- [x] Replaced 6 non-standard error handlers in aiInsightsStore with getErrorMessage() (TODO #154)
- [x] Added type safety to goals.tsx — `keyof Goals` instead of string (TODO #155)
- [x] Replaced hardcoded storage key in goalsStore with STORAGE_KEYS.GOALS constant (TODO #156)
- [x] Optimized healthInsightsAI: replaced 4 unbounded getAll() with getByDateRange() (TODO #157)
- [x] Optimized getDailyStreak(): replaced unbounded getAll() with 90-day bounded getByDateRange() (TODO #158)
- [x] Extracted reusable ModalHeader component, updated 5 modals (TODO #159)
- [x] Extracted 6 default AI fallback constants from healthInsightsAI (TODO #160)
- [x] Consolidated 4 food macro reduce() calls into single for..of loop (TODO #162)
- [x] Added ModalHeader component tests (2 tests), removed unused DEFAULT_CALORIE_GOAL constant (TODO #163)
- [x] Improved store branch coverage to 100% for exercise, sleep, journal, nutrition stores (TODO #164)
- [x] Added 5 non-text response tests for healthInsightsAI — 575 total tests (TODO #165)
- [x] Added missing sports/cardio/stretching to calorie estimation, toggleCompletion error test, updateUserProfile edge cases — 578 total tests (TODO #166)
- [x] Fixed stale date in dashboard, extracted safeJsonParse, used colors.overlay in 7 modals, unified theme key, fixed sleep #FFFFFF, removed dead DateString type (TODO #167)
- [x] Extracted useApiKeyExists hook, replaced 5 copy-pasted checkApiKey patterns across tab screens (TODO #168)
- [x] Replaced hardcoded max_tokens and paddingBottom with named constants (TODO #169)
- [x] Extracted useApiKeyExists hook, removed 5 copy-pasted checkApiKey patterns from tab screens (TODO #168)
- [x] Fixed screen transition glitching + polished animations app-wide: centralized constants, navigation guard, AnimatedCard entering/exiting, tab crossfade, StreakCelebration reanimated migration, exit animations everywhere (TODO #170)
- [x] Fixed test suite after animation rewrite: updated 7 reanimated mocks to strip entering/exiting props, added Firebase ESM mocks to jest.setup.js, removed unused TRANSLATE import (TODO #171)
- [x] Deduplicated 7 inline reanimated test mocks into shared __tests__/helpers/reanimatedMock.ts (TODO #172)
- [x] Added onboardingStore tests: initialize, setCompleted, legacy key migration, error fallback — 7 tests, 585 total (TODO #173)
- [x] Extracted getAuthErrorMessage utility, replaced 3 duplicate functions across auth screens (TODO #174)
- [x] Added FadeInDown/FadeOut entrance animations to forgot-password and verify-email screens (TODO #175)
- [x] Fixed auth consistency: STORAGE_KEYS.AUTH_USER, getAuthErrorMessage in login, EMAIL_VERIFICATION_POLL_MS (TODO #176)
- [x] Fixed missing await on completeOnboarding() in onboarding.tsx (TODO #177)
- [x] Added demoData tests (6): habit creation, completions, sleep, exercise, meals, journals — 595 total (TODO #178)
- [x] Wired habitReminders to UI: reminder toggle + time picker in CreateHabitModal, cancel on delete, Habit type null support — 5 new tests, 600 total (TODO #179)
- [x] Cleaned up 159 redundant toBeTruthy() assertions across 21 test files (TODO #180)
- [x] Fixed setSaving(false) leak in 3 modal save handlers — moved to finally block (TODO #181)
- [x] Added zod validation to 6 healthInsightsAI JSON.parse() casts — 7 schemas, 1 new test, 601 total (TODO #182)
- [x] Added settings screen tests (17): API key management, sign out, export, clear data, theme, privacy — 618 total (TODO #184)
- [x] Fixed unsafe cast in login, dedup AICoaching hasKey, memoized onboarding slides + journal entries (TODO #185)
- [x] Added onboarding screen tests (6): slide rendering, Skip/Next, navigation, all 6 slide titles — 624 total (TODO #186)
- [x] Fixed 3 unawaited async calls: nutrition fetchAdvice, journal fetchMoodAnalysis, habits deleteHabit + added success haptic (TODO #187)
- [x] Added habits screen tests (8): empty state, habit rendering, error banner, mount loading, skeleton loading, streaks — 632 total (TODO #188)

### ~~189. Add nutrition screen tests~~ ✅
- `app/(tabs)/nutrition.tsx` (314 lines) has zero screen-level test coverage. Contains calorie progress bar, daily summary, meal list, AI advice section, date navigation.
- **Status:** Done — 8 tests: empty state, daily summary totals, meal card, multiple meals, error banner, mount loading, skeleton loading, section title. 640 total tests.

### ~~190. Add sleep screen tests~~ ✅
- `app/(tabs)/sleep.tsx` has zero screen-level test coverage. Contains sleep entry display, 7-day summary, AI analysis section, date navigation.
- **Status:** Done — 7 tests: empty state, entry card with quality badge, 7-day summary, error banner, mount loading, skeleton loading, quality labels. 647 total tests.

### ~~191. Add exercise screen tests~~ ✅
- `app/(tabs)/exercise.tsx` has zero screen-level test coverage. Contains workout cards, summary stats, AI recommendation section, date navigation.
- **Status:** Done — 7 tests: empty state, workout card with type/stats, multiple workouts, 7-day summary, error banner, mount loading, skeleton loading. 654 total tests.

### ~~192. Add journal screen tests~~ ✅
- `app/(tabs)/journal.tsx` has zero screen-level test coverage. Contains search, tag filtering, entry cards, mood analysis section.
- **Status:** Done — 10 tests: empty state, entry card, multiple entries, mood badge, search bar, tag filter pills, error banner, mount loading, skeleton loading, scanned badge. 664 total tests.

### ~~193. Add goals screen tests + fix missing error handling~~ ✅
- `app/goals.tsx` has zero screen-level test coverage. Also, `handleSave` lacks try-catch — if `updateGoals()` fails, users get no feedback.
- **Status:** Done — added try-catch with Alert to handleSave. 7 tests: title/description, 6 goal cards, goal values, mount loading, save button, save error alert, save success navigation. 671 total tests.

### ~~194. Remove unused react-dom and react-native-web dependencies~~ — Skipped
- Both are in package.json but never directly imported. However, `app.json` has a `web` config section and `npm run web` is a configured script. Expo needs `react-native-web` + `react-dom` for web builds. Not safe to remove.

### ~~195. Add safeJsonParse test + remove unused theme color properties~~ ✅
- `safeJsonParse<T>` in `src/utils/date.ts` (used by 3 repositories) has no test. Also `primaryLight`, `primaryDark`, and `surfaceElevated` are defined in ThemeContext but never used anywhere.
- **Status:** Done — 4 tests for safeJsonParse (valid JSON, null, empty string, invalid JSON). Removed 3 unused color properties from ThemeColors interface, lightColors, darkColors, and colors.ts. 675 total tests.

### ~~196. DRY up nutrition camera macro calculation — single-pass reduce~~ ✅
- `app/nutrition/camera.tsx` runs 4 separate `.reduce()` calls for protein/carbs/fat/calories on `detectedFoods`. Same pattern as the NutritionLogModal fix (TODO #162).
- **Status:** Done — replaced 7 separate reduce calls (4 in handleSaveMeal, 3 in display JSX) with single memoized `macroTotals` computed via `for...of` loop. 1 pass instead of 7.

### ~~197. Fix setSaving(false) leak in 5 app screen save handlers~~ ✅
- Same bug as TODO #181 (fixed for modals) but in app-level screens: `nutrition/camera.tsx`, `exercise/log.tsx`, `sleep/log.tsx`, `journal/new.tsx`, `journal/scan.tsx`. `setSaving(false)` is after try/catch instead of in `finally`.
- **Status:** Done — moved `setSaving(false)` to `finally` block in all 5 files. 675 tests passing.

### ~~198. Add auth screen tests (login, signup, forgot-password, verify-email)~~ ✅
- 4 auth screens in `app/auth/` have zero test coverage. These are critical user-facing flows handling form validation, error display, and navigation.
- **Status:** Done — 22 tests across 4 auth screens: login (7 tests: title/fields, empty validation, signIn call, error alert, signup nav, forgot-password nav, Google button), signup (6 tests: title/fields, name validation, password mismatch, short password, signUp call, login nav), forgot-password (4 tests: title/input, empty validation, success flow, error alert), verify-email (5 tests: title/email, buttons, check verification, resend email, sign out). Also fixed reanimated mock to include Animated.Text/ScrollView/Image/Pressable. 697 total tests.

### ~~199. Add authService.ts tests (Firebase auth service)~~ ✅
- `src/services/auth/authService.ts` exports 11 functions for Firebase auth but has no tests. Only the mock service and error messages are tested.
- **Status:** Done — 19 tests covering all Firebase auth functions: getCurrentUser (2), onAuthStateChange (4), signUp (3), signIn (1), signInWithGoogle (1), signOut (1), sendVerificationEmail (2), sendPasswordReset (1), updateUserProfile (2), reloadUser (2). Used `require()` after `jest.mock` to ensure Firebase config mock applies before module evaluation. 716 total tests.

### ~~200. Add settings screen tests~~ ✅
- `app/settings.tsx` has no screen-level test coverage. Tests should cover: theme toggle, API key input, data export, demo data loading, version display.
- **Status:** Already done — `__tests__/screens/settings.test.tsx` already exists with 17 tests covering all settings sections.

### ~~201. Fix inconsistent credential.user handling in authService.signUp~~ ✅
- `src/services/auth/authService.ts` line 60: `sendEmailVerification(credential.user)` was called without a null check, but `updateProfile` on line 56 did check.
- **Status:** Done — destructured `const { user } = credential` and used `user` consistently throughout the method. Removed the redundant `credential.user` null check from the `displayName` condition (since `createUserWithEmailAndPassword` always returns a user).

### ~~202. Add firebase config initialization tests~~ ✅
- `src/services/firebase/config.ts` (43 lines) has zero tests. Test `isConfigured` with/without env vars, hot-reload recovery, null exports when unconfigured.
- **Status:** Done — 8 tests: isConfigured false (no vars, partial vars), isConfigured true (all vars), null exports when unconfigured, no initializeApp when unconfigured, initializes new app, reuses existing app, hot-reload fallback to getAuth. Also added missing `getAuth` mock to jest.setup.js. 724 total tests.

### ~~203. Expand constants.test.ts coverage for untested exports~~ ✅
- `constants.test.ts` only tests 3 exports (getQualityColor, estimateCalories, withTimeout) but `constants.ts` exports 13+: STORAGE_KEYS, QUALITY_LABELS, MOOD_LABELS, INTENSITY_LABELS, EXERCISE_TYPE_LABELS, MEAL_TYPE_LABELS, SLEEP_FACTORS, HABIT_COLORS, OCR_CONFIDENCE, AI_MODEL, AI_MAX_TOKENS, APP_LINKS, EMAIL_VERIFICATION_POLL_MS.
- **Status:** Done — Added 20 new tests covering all untested exports: EXERCISE_TYPE_LABELS, INTENSITY_LABELS, MEAL_TYPE_LABELS, QUALITY_LABELS, MOOD_LABELS, SLEEP_FACTORS, HABIT_COLORS, AI constants, STORAGE_KEYS, OCR_CONFIDENCE, APP_LINKS, TAB_CONTENT_PADDING_BOTTOM, EMAIL_VERIFICATION_POLL_MS. 32 tests in constants.test.ts, 741 total.

### ~~204. Remove duplicate feature color definitions from colors.ts~~ ✅
- Feature colors (habits, sleep, exercise, nutrition, journal) are defined in 3 places: `colors.ts`, `ThemeContext.tsx` (light+dark), and `constants.ts` (HABIT_COLORS). `colors.ts` is only used by ErrorBoundary. Remove duplicates.
- **Status:** Done — Deleted `src/theme/colors.ts` (dead code, never imported anywhere) and removed re-export from `src/theme/index.ts`. HABIT_COLORS left in place — it serves a distinct purpose as a color picker palette for habits, not a duplicate of feature colors.
