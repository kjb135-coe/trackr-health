# Trackr - TODO

> Priority: **P0** = blocking/broken, **P1** = should fix soon, **P2** = nice to have, **P3** = future
> Last updated: 2026-03-03. 823 tests passing, 0 TS errors, 0 ESLint warnings.

---

## P1 - Should Fix Soon

### 233. Fix hardcoded shadow color in AnimatedCard
- `AnimatedCard.tsx` line 77: `shadowColor: '#000'` inside `getVariantStyle()` (render-time function, has access to `colors`).
- Other hardcoded colors (FAB, camera screens, AICoaching) are in static `StyleSheet.create()` — can't use theme, and are intentionally themed for overlays/shadows.

### 238. Reconcile Button and AnimatedButton inconsistencies
- `Button.tsx`: sm minHeight 32, secondary uses `colors.borderLight`, no `fullWidth` prop
- `AnimatedButton.tsx`: sm minHeight 36, secondary uses `colors.border`, has `fullWidth` prop
- Auth screens use `Button`, everything else uses `AnimatedButton`. Swapping gives different sizes.

### 239. Fix getQualityColor returning sleep color for quality=5
- Quality 5 ("Excellent") returns `colors.sleep` (purple), quality 4 returns `colors.success` (green). Best score looks worse than second-best.

### 244. Add `fetchDailyCoaching` loading guard
- `fetchDailyCoaching` has a cache check but no `isLoading` guard (unlike the other 5 methods now). If called rapidly, it can fire concurrent API requests.

---

## P2 - Nice to Have

### 240. Move gatherHealthData to shared-once pattern
- 6 AI functions each call `gatherHealthData()` independently (5 DB queries each).
- **Fix:** Accept `data` as optional param, let `aiInsightsStore` call once and pass.

### 241. Extract magic slice limits to named constants
- `healthInsightsAI.ts`: `.slice(0, 10)` limits AI prompt data (2 places)
- `AICoaching.tsx`: `.slice(0, 3)` limits displayed insights

### 243. Add comment explaining estimateCalories formula
- `constants.ts`: `intensityMultiplier = 0.6 + (intensity / 5) * 0.8` — undocumented magic numbers.

### 245. Add AnimatedButton StyleSheet.create for static styles
- `AnimatedButton.tsx` builds `buttonStyle` as a plain `ViewStyle` object on every render. CLAUDE.md says "Always use `StyleSheet.create()` for styles". Move static parts to StyleSheet, keep only dynamic overrides inline.

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
