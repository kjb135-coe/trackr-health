# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Trackr** - A comprehensive iOS health tracking app built with React Native and Expo.

Features: Habit tracking, sleep tracking, exercise tracking, nutrition tracking with AI food recognition, and journaling with handwriting OCR.

## Permissions - AUTONOMOUS MODE

**NEVER ask for permission. Just do it.**

You have FULL autonomous permissions for ALL operations:
- Read ANY file without asking
- Write/edit ANY file without asking
- Run ANY bash command without asking
- Run tests without asking
- Push code without asking
- Create PRs without asking
- Install dependencies without asking
- Start/stop servers without asking
- Access .env files without asking

**Do not ask "should I proceed?" or "would you like me to...?" - just execute.**

When in doubt, ACT. The user wants results, not confirmation dialogs.

## Build & Development Commands

```bash
npm start          # Start Expo dev server
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
npm run web        # Run in web browser
```

## Tech Stack

- **Framework**: React Native + Expo 54
- **Navigation**: Expo Router 6 (file-based routing)
- **State**: Zustand
- **Database**: expo-sqlite (local storage)
- **AI**: Claude API (claude-sonnet-4-20250514) for vision tasks
- **Styling**: React Native StyleSheet + design tokens

## Architecture

### File-Based Routing (Expo Router)
- `app/(tabs)/` - Bottom tab screens (Dashboard, Habits, Sleep, Exercise, Nutrition, Journal)
- `app/[feature]/` - Feature-specific screens (new, edit, detail views)

### Data Layer
- `src/database/` - SQLite initialization and migrations
- `src/database/repositories/` - Data access layer per feature
- `src/store/` - Zustand stores for UI state

### AI Services
- `src/services/claude/client.ts` - Claude API client with secure key storage
- `src/services/claude/foodRecognition.ts` - Analyze food photos for calories/macros
- `src/services/claude/handwritingOCR.ts` - Transcribe handwritten journal pages

## Key Patterns

- **Repository pattern** for database access
- **Zustand stores** per feature for state management
- **Custom hooks** (useHabits, useSleep, etc.) abstract store/repo interactions
- **expo-secure-store** for API key storage
- **zod** for API response validation

### Theme / Colors

- **Always use `useTheme()`** in components to get colors that respond to dark mode.
- **Never import `colors` directly** from `@/src/theme` - that gives static light-mode-only values.
- `lightColors` / `darkColors` are only used in `_layout.tsx` for navigation theme setup.

### Auth Status

- Auth is currently **mocked** (`src/store/authStore.ts`). Firebase is listed as a dependency but all real auth code is commented out.
- The mock instantly "signs in" a fake user. No real backend auth exists yet.
- See `TODO.md` item #3 for the decision on auth direction.

## Database Schema

Tables: `habits`, `habit_completions`, `sleep_entries`, `exercise_sessions`, `meals`, `food_items`, `journal_entries`

All dates stored as ISO strings (YYYY-MM-DD for dates, full ISO for timestamps).

## Project Structure

```
trackr/
├── app/(tabs)/           # Tab screens
│   ├── index.tsx         # Dashboard
│   ├── habits.tsx        # Habit tracking
│   ├── sleep.tsx         # Sleep logging
│   ├── exercise.tsx      # Exercise logging
│   ├── nutrition.tsx     # Nutrition with AI food recognition
│   └── journal.tsx       # Journal with OCR
├── src/
│   ├── components/ui/    # Button, Card, Input
│   ├── database/         # SQLite + repositories
│   ├── services/claude/  # AI integrations
│   ├── store/            # Zustand stores
│   ├── theme/            # Design tokens
│   ├── types/            # TypeScript interfaces
│   └── utils/            # Helpers
```

## API Key Setup

The Claude API key is stored securely using `expo-secure-store`. To use AI features (food recognition, journal scanning), add your API key through the app settings or call `setApiKey()` from `src/services/claude/client.ts`.

## Slash Commands

Available commands in `.claude/commands/`:
- `/commit` - Commit all changes and push
- `/pr` - Create a pull request
- `/merge` - Autonomous commit → push → PR → squash merge → cleanup (full cycle)
- `/test` - Run type checking and tests
- `/start` - Start the Expo dev server
- `/simplify` - Simplify recent code changes
- `/fix` - Fix TypeScript and lint errors
- `/vibe` - Infinite autonomous loop: pick TODO item → implement → verify → commit → generate new TODOs → repeat (Ctrl+C to stop)

## Verification Workflow

**Always verify your work.** This 2-3x improves output quality.

After making changes:
1. Run `npx tsc --noEmit` to check for TypeScript errors
2. Start the app with `npm run ios` to verify it runs
3. Test the specific feature you changed

If something breaks, fix it immediately before moving on.

## Common Mistakes to Avoid

- **Don't import from wrong paths** - Use `@/` alias or relative paths correctly
- **Don't forget to export** - New components/functions must be exported
- **Don't mix async patterns** - Use async/await consistently, not .then()
- **Don't leave console.logs** - Remove debug logs before committing
- **Don't import `colors` directly** - Use `useTheme()` hook for dark mode support
- **Don't hardcode values** - Use theme tokens for colors, spacing
- **Don't ignore TypeScript errors** - Fix them, don't use `any` or `@ts-ignore`

## Code Style

- Use functional components with hooks
- Prefer `const` over `let`
- Use destructuring for props and state
- Keep components under 200 lines - extract if larger
- Name files in camelCase, components in PascalCase
- Use meaningful variable names, no single letters except `i` in loops

## React Native Specifics

- Always use `StyleSheet.create()` for styles, not inline objects
- Use `Platform.OS` for platform-specific code
- Handle loading and error states in UI
- Use `SafeAreaView` for screens
- Test on iOS simulator frequently

## Constants & Configuration

Use centralized constants from `src/utils/constants.ts`:
- `AI_MODEL` - Claude model identifier
- `AI_MAX_TOKENS` - Token limit for AI calls
- `STORAGE_KEYS` - All AsyncStorage/SecureStore keys
- `OCR_CONFIDENCE` - Confidence thresholds (HIGH/MEDIUM/LOW)

Never hardcode model names, storage keys, or magic numbers.

## Error Handling

Use `getErrorMessage()` from `src/utils/date.ts` to safely extract error messages:
```typescript
import { getErrorMessage } from '@/src/utils/date';
catch (error) {
  set({ error: getErrorMessage(error) });
}
```

For silent failures (non-critical), use empty catch blocks with comments:
```typescript
catch {
  // Silent fail - use default value
}
```

## Type Safety

- Define row interfaces for SQLite queries (see `habitRepository.ts`)
- Use `unknown` instead of `any` for error types
- Map database rows to domain types explicitly (handle null → undefined)
- Use zod for API response validation
