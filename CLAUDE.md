# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Trackr** - A comprehensive iOS health tracking app built with React Native and Expo.

Features: Habit tracking, sleep tracking, exercise tracking, nutrition tracking with AI food recognition, and journaling with handwriting OCR.

## Permissions

Full development permissions granted:
- Run any code
- Host servers
- Run tests
- Generate code
- Edit files
- Access .env files

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

## Database Schema

Tables: `habits`, `habit_completions`, `sleep_entries`, `exercise_sessions`, `meals`, `food_items`, `journal_entries`

All dates stored as ISO strings (YYYY-MM-DD for dates, full ISO for timestamps).
