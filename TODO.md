# Trackr - TODO

> Priority: **P0** = blocking/broken, **P1** = should fix soon, **P2** = nice to have, **P3** = future
> Last updated: 2026-03-03. 854 tests passing, 0 TS errors, 0 ESLint warnings.

---

## P2 - Nice to Have

### 253. Wire gatherHealthData sharing into aiInsightsStore
- Now that all AI functions accept optional `preData`, the store could call `gatherHealthData()` once and pass it to multiple consecutive AI calls. Currently only `fetchDailyCoaching` is called from the dashboard — lower priority until multiple AI calls happen simultaneously.

### 254. Extract common log screen patterns
- `app/exercise/log.tsx`, `app/sleep/log.tsx`, `app/journal/new.tsx` share common patterns: header with X close button + title, section title style, save button at bottom. Could extract `LogScreenHeader` and `SectionTitle` components.

### 258. Break down settings.tsx (716 lines)
- Settings screen has too many features in one file. Could extract: ApiKeySection, ThemeSection, GoalsSection, DangerZoneSection, AboutSection into separate components.

### 260. Settings confirmDelete for "Clear All Data"
- Settings screen still uses inline `Alert.alert` for "Clear All Data" and "Sign Out" confirmations. The "Clear All Data" could use a variant of `confirmDelete` or a similar utility, though it has custom button text ("Delete Everything") and post-action logic.

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
