# Trackr - TODO

> Priority: **P0** = blocking/broken, **P1** = should fix soon, **P2** = nice to have, **P3** = future
> Last updated: 2026-03-04. 904 tests passing, 0 TS errors, 0 ESLint warnings.

---

## P2 - Nice to Have

### 291. Phantom completion ID from upsert in habitRepository.setCompletion
- `setCompletion` returns a newly generated `id` even on `ON CONFLICT` update. The actual DB row keeps its original `id`. Currently no code uses the returned `id` to look up/delete, but it's a data consistency gap.

### 292. parseISO timezone mismatch in SleepLogModal date construction
- `parseISO('yyyy-MM-dd')` returns UTC midnight. In western timezones, `getDate()` returns previous day's date. Stored bedtime ISO string has wrong calendar date (time is correct). No visible bug currently but breaks if ISO date is ever parsed for display.

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
