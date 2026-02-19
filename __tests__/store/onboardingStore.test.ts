import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOnboardingStore } from '@/src/store/onboardingStore';
import { STORAGE_KEYS } from '@/src/utils/constants';

const LEGACY_KEY = 'hasCompletedOnboarding';

describe('onboardingStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    // Reset zustand state between tests
    useOnboardingStore.setState({ hasCompleted: null });
  });

  it('initializes with hasCompleted: null', () => {
    const state = useOnboardingStore.getState();
    expect(state.hasCompleted).toBeNull();
  });

  it('initialize sets hasCompleted to false when no stored value', async () => {
    await useOnboardingStore.getState().initialize();
    expect(useOnboardingStore.getState().hasCompleted).toBe(false);
  });

  it('initialize sets hasCompleted to true when stored value is "true"', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
    await useOnboardingStore.getState().initialize();
    expect(useOnboardingStore.getState().hasCompleted).toBe(true);
  });

  it('initialize migrates legacy key to new key', async () => {
    await AsyncStorage.setItem(LEGACY_KEY, 'true');
    await useOnboardingStore.getState().initialize();

    expect(useOnboardingStore.getState().hasCompleted).toBe(true);
    // New key should be set
    expect(await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE)).toBe('true');
    // Legacy key should be removed
    expect(await AsyncStorage.getItem(LEGACY_KEY)).toBeNull();
  });

  it('initialize ignores legacy key when new key exists', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
    await AsyncStorage.setItem(LEGACY_KEY, 'false');
    await useOnboardingStore.getState().initialize();

    expect(useOnboardingStore.getState().hasCompleted).toBe(true);
    // Legacy key should NOT be removed (migration skipped)
    expect(await AsyncStorage.getItem(LEGACY_KEY)).toBe('false');
  });

  it('initialize falls back to false on error', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('Storage error'));
    await useOnboardingStore.getState().initialize();
    expect(useOnboardingStore.getState().hasCompleted).toBe(false);
  });

  it('setCompleted persists true and updates state', async () => {
    await useOnboardingStore.getState().setCompleted();

    expect(useOnboardingStore.getState().hasCompleted).toBe(true);
    expect(await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE)).toBe('true');
  });
});
