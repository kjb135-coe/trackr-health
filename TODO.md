# Trackr - TODO

> Priority: **P0** = blocking/broken, **P1** = should fix soon, **P2** = nice to have, **P3** = future
> Last updated: 2026-03-04. 907 tests passing, 0 TS errors, 0 ESLint warnings.

---

## P2 - Nice to Have

### 287. resetAllStores uses clearAll() but other stores use setState directly
- `resetAllStores` calls `useAIInsightsStore.getState().clearAll()` but resets all other stores with `setState()`. If any other store adds a `clearAll()` method, the pattern is inconsistent. Consider standardizing to either all `clearAll()` or all `setState()`.

### 288. goalsStore.loadGoals() not called from central init
- After sign-out/sign-in, goals show defaults until the Goals screen is opened. `loadGoals()` should be called during app init or sign-in.

### 289. No cleanup of persisted images on meal/journal deletion
- `persistImage` copies images to app's document directory. When meals or journal entries are deleted, persisted images are never cleaned up, accumulating indefinitely.

---

## P3 - Future / Backlog

### 286. Add delete-failure ErrorBanner rendering tests to screens
- All 5 feature screens use store error state + ErrorBanner for delete failures. Store-level delete error tests exist, but screen-level ErrorBanner rendering on delete failure is untested.

### 253. Wire gatherHealthData sharing into aiInsightsStore
- Deferred — only `fetchDailyCoaching` is called from the dashboard. No concurrent AI calls exist yet.

### 254. Extract common log screen patterns
- Log screens share header/section title/save button patterns but content differs significantly. Payoff is ~10 lines per screen. Low priority.

### 264. JournalEntryModal and NutritionLogModal share modal structure
- Camera/gallery UI duplication reduced via `useImagePicker` hook. Remaining shared structure is minimal.

### 3. Firebase dependency is dead weight (~1MB)
- User decision: Don't touch auth or hosting right now.

### 6. Accessibility is zero
- No `accessibilityLabel`, `accessibilityRole`, or `accessibilityHint` on any interactive element.
- User decision: Backlog.

### 14. No offline-first sync strategy
- All data is local SQLite only. No cloud backup/sync.

### 17. No analytics or crash reporting
- No Sentry, Crashlytics, or similar.
