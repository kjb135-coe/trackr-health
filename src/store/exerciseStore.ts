import { create } from 'zustand';
import { ExerciseSession } from '@/src/types';
import { exerciseRepository } from '@/src/database/repositories';
import { getErrorMessage } from '@/src/utils/date';

interface ExerciseState {
  sessions: ExerciseSession[];
  isLoading: boolean;
  error: string | null;

  loadSessions: () => Promise<void>;
  loadSessionsForRange: (startDate: string, endDate: string) => Promise<void>;
  loadSessionsForDate: (date: string) => Promise<ExerciseSession[]>;
  createSession: (
    session: Omit<ExerciseSession, 'id' | 'createdAt' | 'updatedAt'>,
  ) => Promise<ExerciseSession>;
  updateSession: (
    id: string,
    updates: Partial<Omit<ExerciseSession, 'id' | 'createdAt' | 'updatedAt'>>,
  ) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  getTotalDuration: (startDate: string, endDate: string) => Promise<number>;
  getTotalCalories: (startDate: string, endDate: string) => Promise<number>;
  clearError: () => void;
}

export const useExerciseStore = create<ExerciseState>((set, get) => ({
  sessions: [],
  isLoading: false,
  error: null,

  loadSessions: async () => {
    set({ isLoading: true, error: null });
    try {
      const sessions = await exerciseRepository.getAll();
      set({ sessions, isLoading: false });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  loadSessionsForRange: async (startDate, endDate) => {
    set({ isLoading: true, error: null });
    try {
      const sessions = await exerciseRepository.getByDateRange(startDate, endDate);
      set({ sessions, isLoading: false });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  loadSessionsForDate: async (date) => {
    return exerciseRepository.getByDate(date);
  },

  createSession: async (sessionData) => {
    set({ isLoading: true, error: null });
    try {
      const session = await exerciseRepository.create(sessionData);
      set((state) => ({
        sessions: [session, ...state.sessions].sort((a, b) => b.date.localeCompare(a.date)),
        isLoading: false,
      }));
      return session;
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
      throw error;
    }
  },

  updateSession: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      await exerciseRepository.update(id, updates);
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s,
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
      throw error;
    }
  },

  deleteSession: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await exerciseRepository.delete(id);
      set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
      throw error;
    }
  },

  getTotalDuration: async (startDate, endDate) => {
    return exerciseRepository.getTotalDuration(startDate, endDate);
  },

  getTotalCalories: async (startDate, endDate) => {
    return exerciseRepository.getTotalCalories(startDate, endDate);
  },

  clearError: () => set({ error: null }),
}));
