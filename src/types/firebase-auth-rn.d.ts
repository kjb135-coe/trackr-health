// Type augmentation for firebase/auth React Native exports.
// Metro resolves to the RN bundle at runtime which includes getReactNativePersistence,
// but TypeScript uses the default typings that omit it.
import { Persistence } from 'firebase/auth';

declare module 'firebase/auth' {
  interface ReactNativeAsyncStorage {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  }
  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}
