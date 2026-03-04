import { create } from 'zustand';
import { SleepEntry } from '@/src/types';
import { sleepRepository } from '@/src/database/repositories';
import { getErrorMessage } from '@/src/utils/date';

interface SleepState {
  entries: SleepEntry[];
  isLoading: boolean;
  error: string | null;

  loadEntries: () => Promise<void>;
  loadEntriesForRange: (startDate: string, endDate: string) => Promise<void>;
  getEntryByDate: (date: string) => Promise<SleepEntry | null>;
  createEntry: (entry: Omit<SleepEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<SleepEntry>;
  updateEntry: (
    id: string,
    updates: Partial<Omit<SleepEntry, 'id' | 'createdAt' | 'updatedAt'>>,
  ) => Promise<void>;
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
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  loadEntriesForRange: async (startDate, endDate) => {
    set({ isLoading: true, error: null });
    try {
      const entries = await sleepRepository.getByDateRange(startDate, endDate);
      set({ entries, isLoading: false });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  getEntryByDate: async (date) => {
    try {
      return await sleepRepository.getByDate(date);
    } catch {
      return null;
    }
  },

  createEntry: async (entryData) => {
    set({ isLoading: true, error: null });
    try {
      const existing = await sleepRepository.getByDate(entryData.date);
      if (existing) {
        const msg = 'A sleep entry already exists for this date';
        set({ error: msg, isLoading: false });
        throw new Error(msg);
      }
      const entry = await sleepRepository.create(entryData);
      set((state) => ({
        entries: [entry, ...state.entries].sort((a, b) => b.date.localeCompare(a.date)),
        isLoading: false,
      }));
      return entry;
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
      throw error;
    }
  },

  updateEntry: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      if (updates.date) {
        const currentEntry = get().entries.find((e) => e.id === id);
        if (currentEntry && updates.date !== currentEntry.date) {
          const existing = await sleepRepository.getByDate(updates.date);
          if (existing) {
            const msg = 'A sleep entry already exists for this date';
            set({ error: msg, isLoading: false });
            throw new Error(msg);
          }
        }
      }
      await sleepRepository.update(id, updates);
      set((state) => ({
        entries: state.entries.map((e) =>
          e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e,
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
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
      set({ error: getErrorMessage(error), isLoading: false });
      throw error;
    }
  },

  getAverageQuality: async (startDate, endDate) => {
    try {
      return await sleepRepository.getAverageQuality(startDate, endDate);
    } catch {
      return null;
    }
  },

  getAverageDuration: async (startDate, endDate) => {
    try {
      return await sleepRepository.getAverageDuration(startDate, endDate);
    } catch {
      return null;
    }
  },

  clearError: () => set({ error: null }),
}));
