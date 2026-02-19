import { create } from 'zustand';
import { JournalEntry, OCRResult } from '@/src/types';
import { journalRepository } from '@/src/database/repositories';
import { scanHandwrittenJournal } from '@/src/services/claude';
import { getErrorMessage } from '@/src/utils/date';

interface JournalState {
  entries: JournalEntry[];
  isLoading: boolean;
  isScanning: boolean;
  error: string | null;

  loadEntries: () => Promise<void>;
  loadEntriesForRange: (startDate: string, endDate: string) => Promise<void>;
  loadEntriesForDate: (date: string) => Promise<JournalEntry[]>;
  createEntry: (
    entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>,
  ) => Promise<JournalEntry>;
  updateEntry: (
    id: string,
    updates: Partial<Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>>,
  ) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  search: (query: string) => Promise<JournalEntry[]>;
  scanImage: (imageUri: string) => Promise<OCRResult>;
  getAllTags: () => Promise<string[]>;
  clearError: () => void;
}

export const useJournalStore = create<JournalState>((set, get) => ({
  entries: [],
  isLoading: false,
  isScanning: false,
  error: null,

  loadEntries: async () => {
    set({ isLoading: true, error: null });
    try {
      const entries = await journalRepository.getAll();
      set({ entries, isLoading: false });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  loadEntriesForRange: async (startDate, endDate) => {
    set({ isLoading: true, error: null });
    try {
      const entries = await journalRepository.getByDateRange(startDate, endDate);
      set({ entries, isLoading: false });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  loadEntriesForDate: async (date) => {
    return journalRepository.getByDate(date);
  },

  createEntry: async (entryData) => {
    set({ isLoading: true, error: null });
    try {
      const entry = await journalRepository.create(entryData);
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
      await journalRepository.update(id, updates);
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
      await journalRepository.delete(id);
      set((state) => ({
        entries: state.entries.filter((e) => e.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
      throw error;
    }
  },

  search: async (query) => {
    return journalRepository.search(query);
  },

  scanImage: async (imageUri) => {
    set({ isScanning: true, error: null });
    try {
      const result = await scanHandwrittenJournal(imageUri);
      set({ isScanning: false });
      return result;
    } catch (error) {
      set({ error: getErrorMessage(error), isScanning: false });
      throw error;
    }
  },

  getAllTags: async () => {
    return journalRepository.getAllTags();
  },

  clearError: () => set({ error: null }),
}));
