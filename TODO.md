# Trackr - Codebase Audit & TODO

> Generated 2026-02-18. Items marked `[Q]` need your input - edit your answer inline.
> Priority: **P0** = blocking/broken, **P1** = should fix soon, **P2** = nice to have, **P3** = future

---

## P0 - Critical / Blocking

### 1. No test suite
- Zero tests exist. No test runner configured.
- **Effort:** ~4h for initial setup + first tests
- `[Q]` Which test framework? **Jest + React Native Testing Library** / **Vitest** / **Other:**
Up to you

### 2. No linting or formatting
- No ESLint or Prettier config. No pre-commit hooks.
- **Effort:** ~1h setup
- `[Q]` Set up ESLint + Prettier with Expo recommended config? **Yes** / **No** / **Other:**
Up to you
- `[Q]` Add Husky pre-commit hook for lint-staged? **Yes** / **No**
Up to you
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

### 4. Dark mode broken on several screens
- `app/auth/login.tsx`, `app/auth/signup.tsx`, `app/auth/forgot-password.tsx`, `app/auth/verify-email.tsx` use hardcoded light colors (e.g., `#f5f5f5`, `#333`, `white` backgrounds)
- `app/onboarding.tsx` has similar issues
- `app/goals.tsx` partially broken
- **Effort:** ~2h to fix all screens
- `[Q]` Fix dark mode on auth screens? **Yes** / **Skip for now** (auth is mock anyway)
Yes
- `[Q]` Fix dark mode on onboarding? **Yes** / **Skip for now**
Yes, fix everywhere. 

### 5. StreakBadge & StreakCelebration components unused
- `src/components/habits/StreakBadge.tsx` and `src/components/habits/StreakCelebration.tsx` exist but are never rendered.
- They appear to be finished components waiting to be integrated into the habits screen.
- **Effort:** 30min to integrate, 5min to delete
- `[Q]` **Integrate** into habits screen or **Remove**? Integrate

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

### 8. No CI/CD pipeline
- No GitHub Actions, no automated checks on PRs.
- **Effort:** ~1-2h
- `[Q]` Set up GitHub Actions with type-check + lint + test? **Yes** / **Later**
Yes

### 18. Fix 14 ESLint errors across codebase
- Unescaped JSX entities (`'` and `"`) in exercise, habits/new, goals, AICoaching, StreakCelebration screens
- Firebase config has unresolved import (`@firebase/auth/react-native`)
- **Effort:** ~30min
- These block CI since `npm run lint` exits non-zero

### 9. `colors` vs `useTheme()` inconsistency
- Some files import `colors` directly from `@/src/theme` (static light-only), while others properly use `useTheme()`.
- Direct `colors` imports will break dark mode.
- Already partially addressed (most screens use `useTheme()`), but worth auditing.
- **Effort:** ~1h
Do whatever you think is right.

### 10. Export service error handling
- `app/settings.tsx` lines 252, 271 use `error: any` - should use `unknown` + `getErrorMessage()`.
- Same pattern in `app/nutrition/camera.tsx:78` and `app/journal/scan.tsx:83`.
- **Status:** Fixed in this cleanup (Steps 3-4 of audit).

### 11. Console statements in production code
- `app/(tabs)/index.tsx` lines 107, 129 have `console.log` / `console.error`.
- **Status:** Fixed in this cleanup.

### 12. Hardcoded version string
- `app/settings.tsx` line 535 shows `v1.5.0` but `package.json` says `1.0.0`.
- **Status:** Fixed in this cleanup to read from `Constants.expoConfig?.version`.

---

## P3 - Future / Low Priority

### 19. Fix 74 ESLint warnings (unused imports, missing useEffect deps)
- ~40 `@typescript-eslint/no-unused-vars` warnings across the codebase (unused imports, destructured vars)
- ~15 `react-hooks/exhaustive-deps` warnings (missing dependencies in useEffect)
- Cleaning these up improves code quality and prevents bugs from stale closures
- **Effort:** ~1-2h

### 20. Expand test coverage beyond initial smoke tests
- Only 2 test files exist: `date.test.ts` (4 tests) and `Button.test.tsx` (4 tests)
- Key untested areas: Zustand stores, database repositories, navigation flows, AI service mocks
- **Effort:** ~4-6h for meaningful coverage

### 22. ~~Add sleep, nutrition, and exercise store tests~~ ✅
- ~~Only habitStore has tests. sleepStore, nutritionStore, and exerciseStore follow the same pattern and should be tested.~~
- **Status:** Done — sleepStore (12 tests), exerciseStore (12 tests), nutritionStore (16 tests) added. 83 total tests passing.

### 21. Several `catch (err: any)` patterns remain in auth screens
- `app/auth/login.tsx` and `app/auth/signup.tsx` still use `catch (err: any)` with `err.code` access
- These should use `unknown` type + proper type narrowing per CLAUDE.md guidelines
- **Effort:** ~15min

### 13. ~~No data migration strategy~~ ✅
- ~~SQLite schema changes will break existing data without migrations.~~
- **Status:** Already implemented — `migrations` table + `runMigrations()` system exists in `src/database/index.ts`. Uses named migrations (e.g. `001_initial_schema`) with idempotent application tracking. New migrations just need to be appended to the migrations array.

### 14. No offline-first sync strategy
- All data is local SQLite only. No cloud backup/sync.
- Depends on auth decision (item #3).

### 15. No deep linking configuration
- Expo Router supports it but no scheme is configured.
- **Effort:** ~30min

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

### 32. Refactor large tab screen components (500+ lines)
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
- **Status:** Done — added 17 tests across 3 modal components: CreateHabitModal (5 tests), SleepLogModal (6 tests), ExerciseLogModal (6 tests). Tests cover rendering, form submission, validation alerts, and preFill behavior. 120 total tests passing.

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

### 46. ~~Optimize N+1 query in getWeeklyStats()~~ ✅
- ~~`src/services/insights/healthInsights.ts` getWeeklyStats() loops over all habits calling `getCompletionsForHabit()` once per habit~~
- **Status:** Done — replaced N+1 loop with batch `getCompletionsForDateRange()` + parallel `Promise.all()` for all 5 data sources. Added `getMealsByDateRange()` to nutritionRepository and `getCompletionsForDateRange()` to habitRepository.

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
