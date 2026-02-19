/**
 * Tests for src/services/firebase/config.ts
 *
 * Since the config module evaluates at import time, we use
 * jest.resetModules + require() to load it fresh with different
 * env var and mock configurations.
 */

// Save original env
const originalEnv = { ...process.env };

function clearFirebaseEnv() {
  delete process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  delete process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  delete process.env.EXPO_PUBLIC_FIREBASE_APP_ID;
  delete process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN;
  delete process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET;
  delete process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
}

function setFirebaseEnv(apiKey: string, projectId: string, appId: string) {
  process.env.EXPO_PUBLIC_FIREBASE_API_KEY = apiKey;
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID = projectId;
  process.env.EXPO_PUBLIC_FIREBASE_APP_ID = appId;
}

beforeEach(() => {
  jest.resetModules();
  clearFirebaseEnv();
});

afterAll(() => {
  process.env = originalEnv;
});

describe('firebase/config', () => {
  describe('isConfigured', () => {
    it('is false when no env vars are set', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { isConfigured } = require('@/src/services/firebase/config');
      expect(isConfigured).toBe(false);
    });

    it('is false when only apiKey is set', () => {
      process.env.EXPO_PUBLIC_FIREBASE_API_KEY = 'test-key';
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { isConfigured } = require('@/src/services/firebase/config');
      expect(isConfigured).toBe(false);
    });

    it('is true when all required env vars are set', () => {
      setFirebaseEnv('test-key', 'test-project', 'test-app');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { isConfigured } = require('@/src/services/firebase/config');
      expect(isConfigured).toBe(true);
    });
  });

  describe('when not configured', () => {
    it('exports null app and auth', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { app, auth } = require('@/src/services/firebase/config');
      expect(app).toBeNull();
      expect(auth).toBeNull();
    });

    it('does not call initializeApp', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { initializeApp } = require('firebase/app');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@/src/services/firebase/config');
      expect(initializeApp).not.toHaveBeenCalled();
    });
  });

  describe('when configured', () => {
    it('initializes app when no existing apps', () => {
      setFirebaseEnv('test-key', 'test-project', 'test-app');

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getApps, initializeApp } = require('firebase/app');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { initializeAuth, getReactNativePersistence } = require('firebase/auth');

      const fakeApp = { name: 'new-app' };
      const fakeAuth = { type: 'auth' };
      (getApps as jest.Mock).mockReturnValue([]);
      (initializeApp as jest.Mock).mockReturnValue(fakeApp);
      (initializeAuth as jest.Mock).mockReturnValue(fakeAuth);
      (getReactNativePersistence as jest.Mock).mockReturnValue('persistence');

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const config = require('@/src/services/firebase/config');

      expect(config.app).toBe(fakeApp);
      expect(config.auth).toBe(fakeAuth);
      expect(initializeApp).toHaveBeenCalled();
      expect(initializeAuth).toHaveBeenCalledWith(fakeApp, { persistence: 'persistence' });
    });

    it('reuses existing app when already initialized', () => {
      setFirebaseEnv('test-key', 'test-project', 'test-app');

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getApps, getApp, initializeApp } = require('firebase/app');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { initializeAuth, getReactNativePersistence } = require('firebase/auth');

      const existingApp = { name: 'existing' };
      (getApps as jest.Mock).mockReturnValue([existingApp]);
      (getApp as jest.Mock).mockReturnValue(existingApp);
      (initializeAuth as jest.Mock).mockReturnValue({ type: 'auth' });
      (getReactNativePersistence as jest.Mock).mockReturnValue('persistence');

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const config = require('@/src/services/firebase/config');

      expect(config.app).toBe(existingApp);
      expect(initializeApp).not.toHaveBeenCalled();
      expect(getApp).toHaveBeenCalled();
    });

    it('falls back to getAuth on hot-reload when initializeAuth throws', () => {
      setFirebaseEnv('test-key', 'test-project', 'test-app');

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getApps, initializeApp } = require('firebase/app');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { initializeAuth, getAuth, getReactNativePersistence } = require('firebase/auth');

      const fakeApp = { name: 'test-app' };
      const existingAuth = { type: 'existing-auth' };
      (getApps as jest.Mock).mockReturnValue([]);
      (initializeApp as jest.Mock).mockReturnValue(fakeApp);
      (initializeAuth as jest.Mock).mockImplementation(() => {
        throw new Error('already initialized');
      });
      (getAuth as jest.Mock).mockReturnValue(existingAuth);
      (getReactNativePersistence as jest.Mock).mockReturnValue('persistence');

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const config = require('@/src/services/firebase/config');

      expect(config.auth).toBe(existingAuth);
      expect(getAuth).toHaveBeenCalledWith(fakeApp);
    });
  });
});
