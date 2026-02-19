import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/src/utils/constants';

const LEGACY_KEY = 'hasCompletedOnboarding';

interface OnboardingState {
  hasCompleted: boolean | null;
  initialize: () => Promise<void>;
  setCompleted: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  hasCompleted: null,

  initialize: async () => {
    try {
      let value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);

      // Migrate legacy key if present
      if (value === null) {
        const legacy = await AsyncStorage.getItem(LEGACY_KEY);
        if (legacy === 'true') {
          await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
          await AsyncStorage.removeItem(LEGACY_KEY);
          value = 'true';
        }
      }

      set({ hasCompleted: value === 'true' });
    } catch {
      // Silent fail - treat as not completed
      set({ hasCompleted: false });
    }
  },

  setCompleted: async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
    set({ hasCompleted: true });
  },
}));
