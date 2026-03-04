# Trackr - TODO

> Priority: **P0** = blocking/broken, **P1** = should fix soon, **P2** = nice to have, **P3** = future
> Last updated: 2026-03-03. 824 tests passing, 0 TS errors, 0 ESLint warnings.

---

## P1 - Should Fix Soon

### 238. Reconcile Button and AnimatedButton inconsistencies
- `Button.tsx`: sm minHeight 32, secondary uses `colors.borderLight`, no `fullWidth` prop
- `AnimatedButton.tsx`: sm minHeight 36, secondary uses `colors.border`, has `fullWidth` prop
- Auth screens use `Button`, everything else uses `AnimatedButton`. Swapping gives different sizes.

### 246. AnimatedButton uses inline styles instead of StyleSheet.create
- `AnimatedButton.tsx` builds `buttonStyle` as a plain `ViewStyle` object on every render. CLAUDE.md says "Always use `StyleSheet.create()` for styles". `Button.tsx` uses StyleSheet correctly.
- **Fix:** Move static parts (flexDirection, alignItems, justifyContent, borderRadius, overflow) to StyleSheet. Keep dynamic (backgroundColor, borderColor, opacity, width) as inline overrides.

---

## P2 - Nice to Have

### 240. Move gatherHealthData to shared-once pattern
- 6 AI functions each call `gatherHealthData()` independently (5 DB queries each).
- **Fix:** Accept `data` as optional param, let `aiInsightsStore` call once and pass.

### 241. Extract magic slice limits to named constants
- `healthInsightsAI.ts`: `.slice(0, 10)` limits AI prompt data (2 places)
- `AICoaching.tsx`: `.slice(0, 3)` limits displayed insights

### 247. Add loading guard tests for remaining 3 AI fetch methods
- `fetchExerciseRecommendation`, `fetchMoodAnalysis`, `fetchNutritionAdvice` have loading guards but no tests proving they work (unlike habits/sleep/coaching which are tested).

---

## P3 - Future / Backlog

### 3. Firebase dependency is dead weight (~1MB)
- User decision: Don't touch auth or hosting right now.

### 6. Accessibility is zero
- No `accessibilityLabel`, `accessibilityRole`, or `accessibilityHint` on any interactive element.
- User decision: Backlog.

### 14. No offline-first sync strategy
- All data is local SQLite only. No cloud backup/sync.

### 17. No analytics or crash reporting
- No Sentry, Crashlytics, or similar.
