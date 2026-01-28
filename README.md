# Trackr

A comprehensive iOS health tracking app built with React Native and Expo.

## Features

- **Habit Tracking** - Track daily habits with streaks and completion rates
- **Sleep Tracking** - Log sleep duration, quality, and patterns
- **Exercise Tracking** - Record workouts with duration, type, and intensity
- **Nutrition Tracking** - Log meals with AI-powered food recognition from photos
- **Journal** - Digital journaling with handwriting OCR to scan written entries

## Tech Stack

- **Framework**: React Native + Expo (managed workflow)
- **Navigation**: Expo Router with bottom tabs
- **State Management**: Zustand
- **Database**: SQLite (expo-sqlite) - all data stored locally
- **AI**: Claude API for food recognition and handwriting OCR

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator (Xcode) or Expo Go app

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm start

# Run on iOS
npm run ios
```

### Environment Variables

Create a `.env` file in the root directory:

```
EXPO_PUBLIC_CLAUDE_API_KEY=your_api_key_here
```

## Project Structure

```
trackr/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Bottom tab navigation
│   │   ├── index.tsx      # Dashboard
│   │   ├── habits.tsx     # Habit tracking
│   │   ├── sleep.tsx      # Sleep tracking
│   │   ├── exercise.tsx   # Exercise tracking
│   │   ├── nutrition.tsx  # Nutrition tracking
│   │   └── journal.tsx    # Journal
├── src/
│   ├── components/        # Reusable components
│   ├── database/          # SQLite setup and repositories
│   ├── services/          # API services (Claude AI)
│   ├── hooks/             # Custom React hooks
│   ├── store/             # Zustand stores
│   ├── types/             # TypeScript interfaces
│   └── theme/             # Design tokens
└── assets/                # Images and fonts
```

## License

MIT
