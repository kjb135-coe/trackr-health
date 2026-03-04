# Trackr - TODO

> Priority: **P0** = blocking/broken, **P1** = should fix soon, **P2** = nice to have, **P3** = future
> Last updated: 2026-03-03. 829 tests passing, 0 TS errors, 0 ESLint warnings.

---

## P2 - Nice to Have

### 240. Move gatherHealthData to shared-once pattern
- 6 AI functions each call `gatherHealthData()` independently (5 DB queries each).
- **Fix:** Accept `data` as optional param, let `aiInsightsStore` call once and pass.

### 241. Extract magic slice limits to named constants
- `healthInsightsAI.ts`: `.slice(0, 10)` limits AI prompt data (2 places)
- `AICoaching.tsx`: `.slice(0, 3)` limits displayed insights

### 249. Add AnimatedCard accessibility attributes
- `AnimatedCard` has `accessibilityRole` and `accessibilityLabel` when `onPress` is set, but not when it's a static card.

### 250. Add tests for standalone log screens (exerciseLog, sleepLog, journalNew)
- `app/exercise/log.tsx`, `app/sleep/log.tsx`, `app/journal/new.tsx` already have screen tests but they only test the modal components. The standalone screens (used from deep links / direct navigation) may have routing or initialization code not covered.

### 251. Add ErrorBoundary recovery test
- `src/components/ui/ErrorBoundary.tsx` has retry functionality but no test verifying the retry resets the error state and re-renders children.

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
