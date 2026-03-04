# Trackr - TODO

> Priority: **P0** = blocking/broken, **P1** = should fix soon, **P2** = nice to have, **P3** = future
> Last updated: 2026-03-04. 940 tests passing, 0 TS errors, 0 ESLint warnings.

---

## P2 - Nice to Have

### 294. nutritionStore concurrent loadDailyTotals race condition
- `createMeal`, `deleteMeal`, `addFoodItem`, and `deleteFoodItem` each call `loadDailyTotals` after their main operation. Two rapid actions race on `dailyTotals`, and whichever resolves last wins. Practically harmless — user actions are seconds apart.

### 303. Notification toggle not persisted across app restarts
- `settings.tsx` stores `notificationsEnabled` in component state only (`useState(true)`). Toggling off and reopening the app resets it to true. Should persist to AsyncStorage or SQLite.

### 307. habits.tsx screen has zero fireEvent interaction tests
- All 8 tests in habits.test.tsx are render-only. No `fireEvent.press` for toggle completion, delete, or edit modal. Adding lucide mock breaks ThemeProvider rendering — needs investigation.

### 310. Repository update methods don't verify row existed
- All repository `update()` methods run UPDATE...WHERE id=? and return void. An update on a non-existent ID silently succeeds. Store optimistic state updates proceed even though nothing was written to disk.

### 311. nutritionRepository.deleteFoodItem doesn't validate mealId matches
- `deleteFoodItem(id, mealId)` deletes by food item `id` alone. If `id` belongs to a different meal than `mealId`, the wrong meal's totals get recalculated while the food item is removed from its actual meal.

---

## P3 - Future / Backlog

### 297. Text inputs on log screens lack maxLength
- Notes fields in exercise/log.tsx, sleep/log.tsx, and journal/new.tsx have no maxLength. Users could create very large entries. Low priority since it's self-limiting in practice.

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
