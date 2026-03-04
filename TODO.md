# Trackr - TODO

> Priority: **P0** = blocking/broken, **P1** = should fix soon, **P2** = nice to have, **P3** = future
> Last updated: 2026-03-03. 881 tests passing, 0 TS errors, 0 ESLint warnings.

---

## P2 - Nice to Have

### 269. Scan title uses non-localizable Date.toLocaleDateString()
- `app/journal/scan.tsx` line 111: `Scanned Entry - ${new Date().toLocaleDateString()}` uses runtime locale formatting. The title string is not extracted. Minor but inconsistent with how other entries generate titles.

### 270. journal/scan.tsx handlePickImage doesn't use useImagePicker hook
- Scan screen still has its own `handlePickImage` with manual `ImagePicker.launchImageLibraryAsync` instead of using the shared `useImagePicker` hook extracted in iteration 12. Refactor for consistency.

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
