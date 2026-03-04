# Trackr - TODO

> Priority: **P0** = blocking/broken, **P1** = should fix soon, **P2** = nice to have, **P3** = future
> Last updated: 2026-03-03. 820 tests passing, 0 TS errors, 0 ESLint errors.

---

## P0 - Security

### 229. Remove EXPO_PUBLIC_CLAUDE_API_KEY env fallback
- `src/services/claude/client.ts` line 27 reads `process.env.EXPO_PUBLIC_CLAUDE_API_KEY` as a fallback. All `EXPO_PUBLIC_` vars are statically inlined into the JS bundle by Metro — anyone who unpacks the `.ipa` can extract it.
- The secure path via `expo-secure-store` already exists and works. The env var fallback is unnecessary and dangerous.
- **Fix:** Remove the env var fallback entirely. Update `.env.example` to remove `EXPO_PUBLIC_CLAUDE_API_KEY`.

---

## P1 - Should Fix Soon

### 230. Fix 31 ESLint warnings (no-require-imports + unused import)
- 30 `@typescript-eslint/no-require-imports` warnings in test files (legitimate `jest.resetModules()` + `require()` pattern).
- 1 unused `fireEvent` import in `habits.test.tsx`.
- **Fix:** Add ESLint override for `__tests__/**/*` to disable `no-require-imports`. Remove unused import.

### 231. Replace hardcoded storage key in Claude client
- `src/services/claude/client.ts` line 5 defines local `API_KEY_STORAGE_KEY = 'CLAUDE_API_KEY'` which duplicates `STORAGE_KEYS.CLAUDE_API_KEY` in `constants.ts`.
- **Fix:** Import from `STORAGE_KEYS` instead.

### 232. Replace deprecated `substr` with `slice` in generateId
- `src/utils/date.ts` line 59 uses deprecated `Math.random().toString(36).substr(2, 9)`.
- **Fix:** Change to `.slice(2, 11)`.

### 233. Fix hardcoded shadow/text colors in 3 components
- `AnimatedCard.tsx` line 77: `shadowColor: '#000'` → should use `colors.black`
- `FAB.tsx` line 69: `shadowColor: '#000000'` → should use `colors.black`
- `AICoaching.tsx` line 345: `color: '#FFFFFF'` → should use `colors.white`

### 234. Extract AI_CACHE_DURATION_MS to constants.ts
- `src/store/aiInsightsStore.ts` line 51: `const CACHE_DURATION = 60 * 60 * 1000` is local. Should be in `constants.ts` per project pattern.

### 235. Add caching/dedup guards to 5 AI insight fetch methods
- Only `fetchDailyCoaching` has cache timestamp check. The other 5 (habits, sleep, exercise, mood, nutrition) always call Claude API on every invocation.
- **Fix:** Add `isLoading` guard to prevent concurrent duplicate requests. Optionally add cache timestamps.

### 236. Replace manual millisecond math with date-fns in healthInsightsAI
- `src/services/ai/healthInsightsAI.ts` line 169: `new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)` — rest of codebase uses `subDays()` from `date-fns`. This doesn't handle DST correctly.
- **Fix:** Use `subDays(today, 7)`.

### 237. Remove unused SpaceMono font load
- `app/_layout.tsx` loads `SpaceMono-Regular.ttf` via `useFonts` but no component uses `fontFamily: 'SpaceMono'`. Leftover from Expo template.

---

## P2 - Nice to Have

### 238. Reconcile Button and AnimatedButton inconsistencies
- `Button.tsx`: sm minHeight 32, secondary uses `colors.borderLight`, no `fullWidth` prop
- `AnimatedButton.tsx`: sm minHeight 36, secondary uses `colors.border`, has `fullWidth` prop
- Users switching between them get different sizes/borders.

### 239. Fix getQualityColor returning sleep color for quality=5
- Quality 5 ("Excellent") returns `colors.sleep` (purple), quality 4 returns `colors.success` (green). Best score looks worse than second-best.

### 240. Move gatherHealthData to shared-once pattern
- 6 AI functions each call `gatherHealthData()` independently, issuing 5 DB queries each. Multiple AI calls = 30+ redundant queries.
- **Fix:** Accept `data` as optional param, let `aiInsightsStore` call once and pass.

### 241. Extract magic slice limits to named constants
- `healthInsightsAI.ts`: `.slice(0, 10)` limits AI prompt data (2 places)
- `AICoaching.tsx`: `.slice(0, 3)` limits displayed insights

---

## P3 - Future / Backlog

### 3. Firebase dependency is dead weight (~1MB)
- User decision: Don't touch auth or hosting right now.

### 6. Accessibility is zero
- No `accessibilityLabel`, `accessibilityRole`, or `accessibilityHint` on any interactive element.
- User decision: Backlog.

### 14. No offline-first sync strategy
- All data is local SQLite only. No cloud backup/sync.
- Depends on auth decision.

### 17. No analytics or crash reporting
- No Sentry, Crashlytics, or similar.
