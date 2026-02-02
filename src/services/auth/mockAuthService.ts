import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

const AUTH_STORAGE_KEY = 'trackr_auth_user';
let authStateCallback: ((user: AuthUser | null) => void) | null = null;
let currentUser: AuthUser | null = null;

async function loadStoredUser(): Promise<AuthUser | null> {
  try {
    const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      currentUser = JSON.parse(stored);
      return currentUser;
    }
  } catch {
    // Silent fail - user will need to sign in
  }
  return null;
}

async function saveUser(user: AuthUser | null): Promise<void> {
  currentUser = user;
  if (user) {
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } else {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  }
  authStateCallback?.(user);
}

export const authService = {
  getCurrentUser(): AuthUser | null {
    return currentUser;
  },

  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    authStateCallback = callback;
    // Load stored user and notify
    loadStoredUser().then((user) => {
      callback(user);
    });
    return () => {
      authStateCallback = null;
    };
  },

  async signUp(email: string, password: string, displayName?: string): Promise<AuthUser> {
    // Simulate signup - in a real app, this would call Firebase
    const user: AuthUser = {
      uid: 'local_' + Date.now(),
      email,
      displayName: displayName || email.split('@')[0],
      photoURL: null,
      emailVerified: false, // Would be true after email verification
    };
    await saveUser(user);
    return user;
  },

  async signIn(email: string, password: string): Promise<AuthUser> {
    // Simulate signin
    const user: AuthUser = {
      uid: 'local_' + Date.now(),
      email,
      displayName: email.split('@')[0],
      photoURL: null,
      emailVerified: true,
    };
    await saveUser(user);
    return user;
  },

  async signInWithGoogle(idToken: string): Promise<AuthUser> {
    // Simulate Google signin
    const user: AuthUser = {
      uid: 'google_' + Date.now(),
      email: 'user@gmail.com',
      displayName: 'Google User',
      photoURL: null,
      emailVerified: true,
    };
    await saveUser(user);
    return user;
  },

  async signOut(): Promise<void> {
    await saveUser(null);
  },

  async sendVerificationEmail(): Promise<void> {
    // Mock - no-op in development
  },

  async sendPasswordReset(_email: string): Promise<void> {
    // Mock - no-op in development
  },

  async updateUserProfile(displayName?: string, photoURL?: string): Promise<void> {
    if (currentUser) {
      currentUser = {
        ...currentUser,
        displayName: displayName ?? currentUser.displayName,
        photoURL: photoURL ?? currentUser.photoURL,
      };
      await saveUser(currentUser);
    }
  },

  async reloadUser(): Promise<AuthUser | null> {
    return currentUser;
  },
};

// Mock Google auth hook
export const useGoogleAuth = (): {
  request: null;
  response: { type: 'dismiss' } | { type: 'success'; params: { id_token: string } } | null;
  promptAsync: () => Promise<{ type: 'dismiss' }>;
} => {
  return {
    request: null,
    response: null,
    promptAsync: async () => ({ type: 'dismiss' as const }),
  };
};
