import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { auth, isConfigured } from '../firebase/config';
import {
  authService as mockAuthService,
  useGoogleAuth as useMockGoogleAuth,
} from './mockAuthService';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

function mapFirebaseUser(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
  };
}

const firebaseAuthService = {
  getCurrentUser(): AuthUser | null {
    const user = auth!.currentUser;
    return user ? mapFirebaseUser(user) : null;
  },

  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    return onAuthStateChanged(auth!, (user) => {
      callback(user ? mapFirebaseUser(user) : null);
    });
  },

  async signUp(email: string, password: string, displayName?: string): Promise<AuthUser> {
    const credential = await createUserWithEmailAndPassword(auth!, email, password);
    const { user } = credential;

    if (displayName) {
      await updateProfile(user, { displayName });
    }

    await sendEmailVerification(user);
    return mapFirebaseUser(user);
  },

  async signIn(email: string, password: string): Promise<AuthUser> {
    const credential = await signInWithEmailAndPassword(auth!, email, password);
    return mapFirebaseUser(credential.user);
  },

  async signInWithGoogle(idToken: string): Promise<AuthUser> {
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth!, credential);
    return mapFirebaseUser(result.user);
  },

  async signOut(): Promise<void> {
    await firebaseSignOut(auth!);
  },

  async sendVerificationEmail(): Promise<void> {
    const user = auth!.currentUser;
    if (user) {
      await sendEmailVerification(user);
    }
  },

  async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(auth!, email);
  },

  async updateUserProfile(displayName?: string, photoURL?: string): Promise<void> {
    const user = auth!.currentUser;
    if (user) {
      await updateProfile(user, { displayName, photoURL });
    }
  },

  async reloadUser(): Promise<AuthUser | null> {
    const user = auth!.currentUser;
    if (user) {
      await user.reload();
      return mapFirebaseUser(user);
    }
    return null;
  },
};

// Use real Firebase auth when configured, otherwise fall back to mock
export const authService = isConfigured ? firebaseAuthService : mockAuthService;

// Google Sign-In hook — real when configured, mock otherwise
const useFirebaseGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  return { request, response, promptAsync };
};

export const useGoogleAuth = isConfigured ? useFirebaseGoogleAuth : useMockGoogleAuth;
