# Trackr - TODO

> Priority: **P0** = blocking/broken, **P1** = should fix soon, **P2** = nice to have, **P3** = future
> Last updated: 2026-03-04. 935 tests passing, 0 TS errors, 0 ESLint warnings.

---

## P2 - Nice to Have

### 294. nutritionStore concurrent loadDailyTotals race condition
- `createMeal`, `deleteMeal`, `addFoodItem`, and `deleteFoodItem` each call `loadDailyTotals` after their main operation. Two rapid actions race on `dailyTotals`, and whichever resolves last wins. Practically harmless — user actions are seconds apart.

### 303. Notification toggle not persisted across app restarts
- `settings.tsx` stores `notificationsEnabled` in component state only (`useState(true)`). Toggling off and reopening the app resets it to true. Should persist to AsyncStorage or SQLite.

### 306. habitStore loadTodayCompletions with explicit date param untested
- All tests call `loadTodayCompletions()` with no argument. The `date` parameter branch used by DateNavigator is never exercised.

### 307. habits.tsx screen has zero fireEvent interaction tests
- All 8 tests in habits.test.tsx are render-only. No `fireEvent.press` for toggle completion, delete, or edit modal. The modal component tests cover these paths, but the screen-level wiring is untested.

### 308. journalRepository.search doesn't escape LIKE wildcard characters
- Searching for `50%` matches every entry because `%` is a LIKE wildcard. Not a SQL injection risk, but a correctness bug. Should escape `%` and `_` in the query.

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
