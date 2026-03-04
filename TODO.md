# Trackr - TODO

> Priority: **P0** = blocking/broken, **P1** = should fix soon, **P2** = nice to have, **P3** = future
> Last updated: 2026-03-03. 821 tests passing, 0 TS errors, 0 ESLint warnings.

---

## P1 - Should Fix Soon

### 233. Fix hardcoded shadow/text colors in 5 files
- `AnimatedCard.tsx`: `shadowColor: '#000'` → `colors.black`
- `FAB.tsx`: `shadowColor: '#000000'` → `colors.black`
- `AICoaching.tsx`: `color: '#FFFFFF'` → `colors.white`
- `app/nutrition/camera.tsx`: 2x `color: '#FFFFFF'`
- `app/journal/scan.tsx`: `color: '#FFFFFF'`

### 234. Extract AI_CACHE_DURATION_MS to constants.ts
- `src/store/aiInsightsStore.ts`: `const CACHE_DURATION = 60 * 60 * 1000` is local. Should be in `constants.ts`.

### 235. Add loading guards to 5 AI insight fetch methods
- Only `fetchDailyCoaching` has cache check. Others always call Claude API — no guard against concurrent duplicate requests.
- **Fix:** Add `if (get().isLoadingX) return` guard to each fetch method.

### 236. Replace manual millisecond math with date-fns in healthInsightsAI
- `healthInsightsAI.ts` line 169: `new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)` — should use `subDays(today, 7)`.

### 242. Fix hardcoded date format in healthInsightsAI gatherHealthData
- `today.toISOString().split('T')[0]` uses UTC, but rest of codebase uses `getDateString()` (local time). Can cause off-by-one date bugs near midnight.

---

## P2 - Nice to Have

### 238. Reconcile Button and AnimatedButton inconsistencies
- `Button.tsx`: sm minHeight 32, secondary uses `colors.borderLight`, no `fullWidth` prop
- `AnimatedButton.tsx`: sm minHeight 36, secondary uses `colors.border`, has `fullWidth` prop

### 239. Fix getQualityColor returning sleep color for quality=5
- Quality 5 ("Excellent") returns `colors.sleep` (purple), quality 4 returns `colors.success` (green). Best score looks worse than second-best.

### 240. Move gatherHealthData to shared-once pattern
- 6 AI functions each call `gatherHealthData()` independently (5 DB queries each).
- **Fix:** Accept `data` as optional param, let `aiInsightsStore` call once and pass.

### 241. Extract magic slice limits to named constants
- `healthInsightsAI.ts`: `.slice(0, 10)` limits AI prompt data (2 places)
- `AICoaching.tsx`: `.slice(0, 3)` limits displayed insights

### 243. Add comment explaining estimateCalories formula
- `constants.ts`: `intensityMultiplier = 0.6 + (intensity / 5) * 0.8` — undocumented magic numbers.

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
