import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import Anthropic from '@anthropic-ai/sdk';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '@/src/utils/constants';

let clientInstance: Anthropic | null = null;

export async function getClaudeClient(): Promise<Anthropic> {
  if (clientInstance) return clientInstance;

  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('Claude API key not configured. Please add your API key in settings.');
  }

  clientInstance = new Anthropic({
    apiKey,
  });

  return clientInstance;
}

export async function getApiKey(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(STORAGE_KEYS.CLAUDE_API_KEY);
  } catch {
    return null;
  }
}

export async function setApiKey(key: string): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEYS.CLAUDE_API_KEY, key);
  clientInstance = null; // Reset to use new key
}

export async function deleteApiKey(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEYS.CLAUDE_API_KEY);
  clientInstance = null;
}

export async function hasApiKey(): Promise<boolean> {
  const key = await getApiKey();
  return key !== null && key.length > 0;
}

export function resetClient(): void {
  clientInstance = null;
}

export function useApiKeyExists(): boolean {
  const [exists, setExists] = useState(false);
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      hasApiKey()
        .then((result) => {
          if (!cancelled) setExists(result);
        })
        .catch(() => {
          if (!cancelled) setExists(false);
        });
      return () => {
        cancelled = true;
      };
    }, []),
  );
  return exists;
}
