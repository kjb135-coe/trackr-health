import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/src/utils/constants';

export interface Goals {
  sleepHours: number;
  exerciseMinutesPerWeek: number;
  dailyCalories: number;
  dailyProtein: number;
  habitsPerDay: number;
  journalEntriesPerWeek: number;
}

interface GoalsState {
  goals: Goals;
  isLoading: boolean;
  loadGoals: () => Promise<void>;
  updateGoals: (goals: Partial<Goals>) => Promise<void>;
}

const DEFAULT_GOALS: Goals = {
  sleepHours: 8,
  exerciseMinutesPerWeek: 150,
  dailyCalories: 2000,
  dailyProtein: 50,
  habitsPerDay: 5,
  journalEntriesPerWeek: 3,
};

export const useGoalsStore = create<GoalsState>((set, get) => ({
  goals: DEFAULT_GOALS,
  isLoading: false,

  loadGoals: async () => {
    set({ isLoading: true });
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.GOALS);
      if (stored) {
        const goals = JSON.parse(stored);
        set({ goals: { ...DEFAULT_GOALS, ...goals } });
      }
    } catch {
      // Silent fail - use default goals
    }
    set({ isLoading: false });
  },

  updateGoals: async (updates) => {
    const newGoals = { ...get().goals, ...updates };
    set({ goals: newGoals });
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(newGoals));
    } catch {
      // Silent fail - goals saved in memory, not persisted
    }
  },
}));
