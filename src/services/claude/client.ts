import Anthropic from '@anthropic-ai/sdk';
import * as SecureStore from 'expo-secure-store';

const API_KEY_STORAGE_KEY = 'CLAUDE_API_KEY';

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
    return await SecureStore.getItemAsync(API_KEY_STORAGE_KEY);
  } catch (error) {
    console.error('Error reading API key:', error);
    return null;
  }
}

export async function setApiKey(key: string): Promise<void> {
  await SecureStore.setItemAsync(API_KEY_STORAGE_KEY, key);
  clientInstance = null; // Reset to use new key
}

export async function deleteApiKey(): Promise<void> {
  await SecureStore.deleteItemAsync(API_KEY_STORAGE_KEY);
  clientInstance = null;
}

export async function hasApiKey(): Promise<boolean> {
  const key = await getApiKey();
  return key !== null && key.length > 0;
}

export function resetClient(): void {
  clientInstance = null;
}
