import { renderHook, waitFor } from '@testing-library/react-native';
import {
  getApiKey,
  setApiKey,
  deleteApiKey,
  hasApiKey,
  resetClient,
  getClaudeClient,
  useApiKeyExists,
} from '@/src/services/claude/client';

const mockGetItemAsync = jest.fn();
const mockSetItemAsync = jest.fn();
const mockDeleteItemAsync = jest.fn();

jest.mock('expo-secure-store', () => ({
  getItemAsync: (...args: unknown[]) => mockGetItemAsync(...args),
  setItemAsync: (...args: unknown[]) => mockSetItemAsync(...args),
  deleteItemAsync: (...args: unknown[]) => mockDeleteItemAsync(...args),
}));

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => (() => void) | void) => {
    const { useEffect } = require('react');
    useEffect(() => {
      const cleanup = callback();
      return typeof cleanup === 'function' ? cleanup : undefined;
    }, [callback]);
  },
}));

jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: { create: jest.fn() },
  }));
});

beforeEach(() => {
  jest.clearAllMocks();
  resetClient();
});

describe('claudeClient', () => {
  describe('getApiKey', () => {
    // Note: EXPO_PUBLIC_* env vars are inlined by Expo's babel plugin at compile time,
    // so they can't be tested by modifying process.env at runtime.

    it('reads from secure storage', async () => {
      mockGetItemAsync.mockResolvedValue('sk-secure-key');

      const key = await getApiKey();

      expect(key).toBe('sk-secure-key');
      expect(mockGetItemAsync).toHaveBeenCalledWith('CLAUDE_API_KEY');
    });

    it('returns null when no key exists', async () => {
      mockGetItemAsync.mockResolvedValue(null);

      const key = await getApiKey();

      expect(key).toBeNull();
    });

    it('returns null on secure store error', async () => {
      mockGetItemAsync.mockRejectedValue(new Error('SecureStore unavailable'));

      const key = await getApiKey();

      expect(key).toBeNull();
    });
  });

  describe('setApiKey', () => {
    it('stores key in secure storage', async () => {
      mockSetItemAsync.mockResolvedValue(undefined);

      await setApiKey('sk-new-key');

      expect(mockSetItemAsync).toHaveBeenCalledWith('CLAUDE_API_KEY', 'sk-new-key');
    });
  });

  describe('deleteApiKey', () => {
    it('removes key from secure storage', async () => {
      mockDeleteItemAsync.mockResolvedValue(undefined);

      await deleteApiKey();

      expect(mockDeleteItemAsync).toHaveBeenCalledWith('CLAUDE_API_KEY');
    });
  });

  describe('hasApiKey', () => {
    it('returns true when key exists', async () => {
      mockGetItemAsync.mockResolvedValue('sk-test');

      const result = await hasApiKey();

      expect(result).toBe(true);
    });

    it('returns false when no key', async () => {
      mockGetItemAsync.mockResolvedValue(null);

      const result = await hasApiKey();

      expect(result).toBe(false);
    });

    it('returns false for empty key', async () => {
      mockGetItemAsync.mockResolvedValue('');

      const result = await hasApiKey();

      expect(result).toBe(false);
    });
  });

  describe('useApiKeyExists', () => {
    it('returns true when API key exists in SecureStore', async () => {
      mockGetItemAsync.mockResolvedValue('sk-test');
      const { result } = renderHook(() => useApiKeyExists());
      await waitFor(
        () => {
          expect(result.current).toBe(true);
        },
        { timeout: 5000 },
      );
    });

    it('returns false when no API key', async () => {
      mockGetItemAsync.mockResolvedValue(null);
      const { result } = renderHook(() => useApiKeyExists());
      expect(result.current).toBe(false);
    });

    it('handles SecureStore rejection gracefully', async () => {
      mockGetItemAsync.mockRejectedValue(new Error('SecureStore unavailable'));
      const { result } = renderHook(() => useApiKeyExists());
      // Should catch the error and keep returning false (not crash)
      await waitFor(
        () => {
          expect(result.current).toBe(false);
        },
        { timeout: 5000 },
      );
    });
  });

  describe('getClaudeClient', () => {
    it('creates client with API key', async () => {
      mockGetItemAsync.mockResolvedValue('sk-test-key');

      const client = await getClaudeClient();

      expect(client).toBeDefined();
      expect(client.messages).toBeDefined();
    });

    it('returns cached client on subsequent calls', async () => {
      mockGetItemAsync.mockResolvedValue('sk-test-key');

      const client1 = await getClaudeClient();
      const client2 = await getClaudeClient();

      expect(client1).toBe(client2);
      // getApiKey should only be called once (for first creation)
      expect(mockGetItemAsync).toHaveBeenCalledTimes(1);
    });

    it('throws when no API key configured', async () => {
      mockGetItemAsync.mockResolvedValue(null);

      await expect(getClaudeClient()).rejects.toThrow(
        'Claude API key not configured. Please add your API key in settings.',
      );
    });
  });
});
