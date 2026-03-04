# Trackr - TODO

> Priority: **P0** = blocking/broken, **P1** = should fix soon, **P2** = nice to have, **P3** = future
> Last updated: 2026-03-03. 831 tests passing, 0 TS errors, 0 ESLint warnings.

---

## P2 - Nice to Have

### 249. Add AnimatedCard accessibility attributes
- `AnimatedCard` has `accessibilityRole` and `accessibilityLabel` when `onPress` is set, but not when it's a static card.

### 250. Add tests for standalone log screens
- `app/exercise/log.tsx`, `app/sleep/log.tsx`, `app/journal/new.tsx` have screen tests but routing/initialization code may not be fully covered.

### 252. Deduplicate `getVariantStyle` and `getTextColor` in Button/AnimatedButton
- Both components have identical switch statements for variant styles and text colors. Could extract a shared `getButtonVariantStyles(variant, colors)` utility.

### 253. Wire gatherHealthData sharing into aiInsightsStore
- Now that all AI functions accept optional `preData`, the store could call `gatherHealthData()` once and pass it to multiple consecutive AI calls (e.g., when dashboard loads coaching + habit suggestions).

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
