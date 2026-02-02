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
import { auth } from '../firebase/config';
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

export const authService = {
  // Get current user
  getCurrentUser(): AuthUser | null {
    const user = auth.currentUser;
    return user ? mapFirebaseUser(user) : null;
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    return onAuthStateChanged(auth, (user) => {
      callback(user ? mapFirebaseUser(user) : null);
    });
  },

  // Sign up with email and password
  async signUp(email: string, password: string, displayName?: string): Promise<AuthUser> {
    const credential = await createUserWithEmailAndPassword(auth, email, password);

    if (displayName && credential.user) {
      await updateProfile(credential.user, { displayName });
    }

    // Send verification email
    await sendEmailVerification(credential.user);

    return mapFirebaseUser(credential.user);
  },

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<AuthUser> {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return mapFirebaseUser(credential.user);
  },

  // Sign in with Google
  async signInWithGoogle(idToken: string): Promise<AuthUser> {
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    return mapFirebaseUser(result.user);
  },

  // Sign out
  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  },

  // Send email verification
  async sendVerificationEmail(): Promise<void> {
    const user = auth.currentUser;
    if (user) {
      await sendEmailVerification(user);
    }
  },

  // Send password reset email
  async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  },

  // Update user profile
  async updateUserProfile(displayName?: string, photoURL?: string): Promise<void> {
    const user = auth.currentUser;
    if (user) {
      await updateProfile(user, { displayName, photoURL });
    }
  },

  // Reload user to get updated email verification status
  async reloadUser(): Promise<AuthUser | null> {
    const user = auth.currentUser;
    if (user) {
      await user.reload();
      return mapFirebaseUser(user);
    }
    return null;
  },
};

// Google Sign-In hook configuration
export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  return { request, response, promptAsync };
};
