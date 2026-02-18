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

### 13. No data migration strategy
- SQLite schema changes will break existing data without migrations.
- Currently relies on `CREATE TABLE IF NOT EXISTS`.
- **Effort:** ~2h for migration framework

### 14. No offline-first sync strategy
- All data is local SQLite only. No cloud backup/sync.
- Depends on auth decision (item #3).

### 15. No deep linking configuration
- Expo Router supports it but no scheme is configured.
- **Effort:** ~30min

### 16. Image caching for food photos
- Food recognition camera captures photos but doesn't persist them to a gallery.
- **Effort:** ~1-2h

### 17. No analytics or crash reporting
- No Sentry, Crashlytics, or similar.
- `[Q]` Want crash reporting? **Sentry** / **Firebase Crashlytics** / **None for now**

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
