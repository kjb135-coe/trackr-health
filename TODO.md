# Trackr - TODO

> Priority: **P0** = blocking/broken, **P1** = should fix soon, **P2** = nice to have, **P3** = future
> Last updated: 2026-03-04. 957 tests passing, 0 TS errors, 0 ESLint warnings.

---

## P2 - Nice to Have

### 294. nutritionStore concurrent loadDailyTotals race condition
- `createMeal`, `deleteMeal`, `addFoodItem`, and `deleteFoodItem` each call `loadDailyTotals` after their main operation. Two rapid actions race on `dailyTotals`, and whichever resolves last wins. Practically harmless — user actions are seconds apart.

### 314. Notification toggle doesn't cancel/reschedule habit reminders
- `handleNotificationToggle(false)` now persists the preference to AsyncStorage but does NOT cancel any scheduled expo-notifications. Habit reminders keep firing. Should iterate all habits and call `cancelHabitReminder` when toggled off, and `scheduleHabitReminder` for each when toggled back on.

### 318. SQLite foreign keys not enabled (PRAGMA foreign_keys = ON)
- Schema defines `ON DELETE CASCADE` for `habit_completions` and `food_items`, but `PRAGMA foreign_keys` is never set. SQLite defaults to OFF, so cascade constraints are dead. `habitRepository.delete()` manually cascades (safe), but `nutritionRepository.deleteMeal()` relies on the (unenforced) cascade for `food_items` cleanup. Should add `PRAGMA foreign_keys = ON` after opening the database.

### 319. Goals screen doesn't display goalsStore.error to users
- `goalsStore.updateGoals` now sets `error` state on persistence failure (#315), but the goals settings screen doesn't read or display this error. Users still get no visual feedback. Should show an error banner or toast when `error` is set.

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
