import { create } from 'zustand';
import { Habit, HabitCompletion } from '@/src/types';
import { habitRepository } from '@/src/database/repositories';
import { subDays, format } from 'date-fns';
import { getDateString, getErrorMessage, parseDate } from '@/src/utils/date';

interface HabitState {
  habits: Habit[];
  todayCompletions: Map<string, HabitCompletion>;
  isLoading: boolean;
  error: string | null;

  loadHabits: () => Promise<void>;
  loadTodayCompletions: (date?: string) => Promise<void>;
  createHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Habit>;
  updateHabit: (
    id: string,
    updates: Partial<Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>>,
  ) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleCompletion: (habitId: string, date?: string) => Promise<void>;
  getStreak: (habitId: string) => Promise<number>;
  getAllStreaks: () => Promise<Map<string, number>>;
  getWeeklyCompletions: (endDate: string) => Promise<Map<string, Set<string>>>;
  clearError: () => void;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  todayCompletions: new Map(),
  isLoading: false,
  error: null,

  loadHabits: async () => {
    set({ isLoading: true, error: null });
    try {
      const habits = await habitRepository.getAll();
      set({ habits, isLoading: false });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  loadTodayCompletions: async (date) => {
    try {
      const dateStr = date || getDateString();
      const completions = await habitRepository.getCompletionsForDate(dateStr);
      const completionMap = new Map<string, HabitCompletion>();
      completions.forEach((c) => completionMap.set(c.habitId, c));
      set({ todayCompletions: completionMap });
    } catch (error) {
      set({ error: getErrorMessage(error) });
    }
  },

  createHabit: async (habitData) => {
    set({ isLoading: true, error: null });
    try {
      const habit = await habitRepository.create(habitData);
      set((state) => ({
        habits: [habit, ...state.habits],
        isLoading: false,
      }));
      return habit;
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
      throw error;
    }
  },

  updateHabit: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      await habitRepository.update(id, updates);
      set((state) => ({
        habits: state.habits.map((h) =>
          h.id === id ? { ...h, ...updates, updatedAt: new Date().toISOString() } : h,
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
      throw error;
    }
  },

  deleteHabit: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await habitRepository.delete(id);
      set((state) => ({
        habits: state.habits.filter((h) => h.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
      throw error;
    }
  },

  toggleCompletion: async (habitId, date) => {
    const dateStr = date || getDateString();
    const { todayCompletions } = get();
    const existing = todayCompletions.get(habitId);
    const newCompleted = !existing?.completed;

    try {
      const completion = await habitRepository.setCompletion(habitId, dateStr, newCompleted);

      set((state) => {
        const newMap = new Map(state.todayCompletions);
        newMap.set(habitId, completion);
        return { todayCompletions: newMap };
      });
    } catch (error) {
      set({ error: getErrorMessage(error) });
    }
  },

  getStreak: async (habitId) => {
    return habitRepository.getStreak(habitId);
  },

  getAllStreaks: async () => {
    const { habits } = get();
    const habitIds = habits.map((h) => h.id);
    return habitRepository.getAllStreaks(habitIds);
  },

  getWeeklyCompletions: async (endDate) => {
    const end = parseDate(endDate);
    const startDate = format(subDays(end, 6), 'yyyy-MM-dd');
    const completions = await habitRepository.getCompletionsForDateRange(startDate, endDate);
    const result = new Map<string, Set<string>>();
    for (const c of completions) {
      if (c.completed) {
        if (!result.has(c.habitId)) result.set(c.habitId, new Set());
        result.get(c.habitId)!.add(c.date);
      }
    }
    return result;
  },

  clearError: () => set({ error: null }),
}));
