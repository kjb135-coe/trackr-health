# Trackr - TODO

> Priority: **P0** = blocking/broken, **P1** = should fix soon, **P2** = nice to have, **P3** = future
> Last updated: 2026-03-04. 965 tests passing, 0 TS errors, 0 ESLint warnings.

---

## P2 - Nice to Have

### 294. nutritionStore concurrent loadDailyTotals race condition
- `createMeal`, `deleteMeal`, `addFoodItem`, and `deleteFoodItem` each call `loadDailyTotals` after their main operation. Two rapid actions race on `dailyTotals`, and whichever resolves last wins. Practically harmless — user actions are seconds apart.

### 324. CreateHabitModal should show visual indicator when notifications are disabled
- When a user enables the reminder toggle in CreateHabitModal but notifications are globally disabled, there's no visual feedback. The reminder toggle appears to work but scheduling is silently skipped. Could show an inline warning or auto-disable the toggle.

### 325. Goals screen error banner should auto-dismiss on retry
- The inline error banner (#322) persists until the store error is cleared. Could add a dismiss button or auto-clear after a few seconds so the user isn't stuck looking at a stale error.

---

## P3 - Future / Backlog

### 320. habitRepository.delete() manual cascade is now redundant
- With PRAGMA foreign_keys = ON (#318), the ON DELETE CASCADE on habit_completions handles cleanup automatically. The manual `DELETE FROM habit_completions WHERE habit_id = ?` is redundant. Kept for defense-in-depth but could be removed.

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
