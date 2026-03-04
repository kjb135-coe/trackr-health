# Trackr - TODO

> Priority: **P0** = blocking/broken, **P1** = should fix soon, **P2** = nice to have, **P3** = future
> Last updated: 2026-03-04. 899 tests passing, 0 TS errors, 0 ESLint warnings.

---

## P2 - Nice to Have

### 286. Add delete-failure error tests across all 5 feature screens
- Habits, sleep, exercise, nutrition, journal screens all handle delete failures but none have tests for `mockDelete*.mockRejectedValue()`.

### 287. Add `updateSession` failure test for ExerciseLogModal
- Edit mode error alert path untested at component level.

### 288. Add journal search interaction test
- JournalScreen search bar renders but no test verifies filtered result display via `mockSearch.mockResolvedValue([matchingEntry])`.

---

## P3 - Future / Backlog

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
