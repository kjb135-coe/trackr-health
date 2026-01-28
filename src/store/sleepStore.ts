import { create } from 'zustand';
import { SleepEntry } from '@/src/types';
import { sleepRepository } from '@/src/database/repositories';

interface SleepState {
  entries: SleepEntry[];
  isLoading: boolean;
  error: string | null;

  loadEntries: () => Promise<void>;
  loadEntriesForRange: (startDate: string, endDate: string) => Promise<void>;
  getEntryByDate: (date: string) => Promise<SleepEntry | null>;
  createEntry: (entry: Omit<SleepEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<SleepEntry>;
  updateEntry: (id: string, updates: Partial<Omit<SleepEntry, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  getAverageQuality: (startDate: string, endDate: string) => Promise<number | null>;
  getAverageDuration: (startDate: string, endDate: string) => Promise<number | null>;
  clearError: () => void;
}

export const useSleepStore = create<SleepState>((set, get) => ({
  entries: [],
  isLoading: false,
  error: null,

  loadEntries: async () => {
    set({ isLoading: true, error: null });
    try {
      const entries = await sleepRepository.getAll();
      set({ entries, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  loadEntriesForRange: async (startDate, endDate) => {
    set({ isLoading: true, error: null });
    try {
      const entries = await sleepRepository.getByDateRange(startDate, endDate);
      set({ entries, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  getEntryByDate: async (date) => {
    return sleepRepository.getByDate(date);
  },

  createEntry: async (entryData) => {
    set({ isLoading: true, error: null });
    try {
      const entry = await sleepRepository.create(entryData);
      set((state) => ({
        entries: [entry, ...state.entries].sort((a, b) => b.date.localeCompare(a.date)),
        isLoading: false,
      }));
      return entry;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateEntry: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      await sleepRepository.update(id, updates);
      set((state) => ({
        entries: state.entries.map((e) =>
          e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteEntry: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await sleepRepository.delete(id);
      set((state) => ({
        entries: state.entries.filter((e) => e.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  getAverageQuality: async (startDate, endDate) => {
    return sleepRepository.getAverageQuality(startDate, endDate);
  },

  getAverageDuration: async (startDate, endDate) => {
    return sleepRepository.getAverageDuration(startDate, endDate);
  },

  clearError: () => set({ error: null }),
}));
