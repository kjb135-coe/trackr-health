# Trackr - TODO

> Priority: **P0** = blocking/broken, **P1** = should fix soon, **P2** = nice to have, **P3** = future
> Last updated: 2026-03-04. 951 tests passing, 0 TS errors, 0 ESLint warnings.

---

## P2 - Nice to Have

### 294. nutritionStore concurrent loadDailyTotals race condition
- `createMeal`, `deleteMeal`, `addFoodItem`, and `deleteFoodItem` each call `loadDailyTotals` after their main operation. Two rapid actions race on `dailyTotals`, and whichever resolves last wins. Practically harmless — user actions are seconds apart.

### 314. Notification toggle doesn't cancel/reschedule habit reminders
- `handleNotificationToggle(false)` now persists the preference to AsyncStorage but does NOT cancel any scheduled expo-notifications. Habit reminders keep firing. Should iterate all habits and call `cancelHabitReminder` when toggled off, and `scheduleHabitReminder` for each when toggled back on.

### 315. goalsStore updateGoals silently swallows AsyncStorage errors
- `updateGoals` optimistically updates state then writes to AsyncStorage with a silent catch. If persistence fails, users lose goal changes on app restart without any feedback. Should at minimum log the error or set an error state.

### 316. Repository delete methods don't verify row existed
- Same pattern as #310 (now fixed for update). All `delete()` methods run DELETE...WHERE id=? and return void. A delete on a non-existent ID silently succeeds. Store optimistic removals proceed. Apply the same `result.changes === 0` check.

### 317. Repository delete methods should also verify row for confirmDelete flows
- `habitRepository.delete()` cascades (deletes completions then habit). If the habit ID doesn't exist, completions delete is a no-op and habit delete silently succeeds. The confirmDelete UI shows success toast even though nothing was deleted.

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
