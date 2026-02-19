/**
 * Tests for src/services/auth/authService.ts — the Firebase auth service.
 *
 * We use jest.isolateModules to ensure clean module loading so our mock of
 * firebase/config takes effect before authService evaluates `isConfigured`.
 */
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';

// These are already mocked in jest.setup.js
const mockedCreateUser = createUserWithEmailAndPassword as jest.Mock;
const mockedSignIn = signInWithEmailAndPassword as jest.Mock;
const mockedSignOut = firebaseSignOut as jest.Mock;
const mockedSendEmailVerification = sendEmailVerification as jest.Mock;
const mockedSendPasswordReset = sendPasswordResetEmail as jest.Mock;
const mockedUpdateProfile = updateProfile as jest.Mock;
const mockedOnAuthStateChanged = onAuthStateChanged as jest.Mock;
const mockedGoogleCredential = GoogleAuthProvider.credential as jest.Mock;
const mockedSignInWithCredential = signInWithCredential as jest.Mock;

// Mock expo-auth-session and expo-web-browser (imported at top level by authService)
jest.mock('expo-auth-session/providers/google', () => ({
  useAuthRequest: jest.fn(() => [null, null, jest.fn()]),
}));

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

// Shared mock auth object — authService references this via the config mock
const mockAuth: {
  currentUser: {
    uid: string;
    email: string;
    displayName: string | null;
    photoURL: string | null;
    emailVerified: boolean;
    reload: jest.Mock;
  } | null;
} = { currentUser: null };

// Mock firebase config to enable the Firebase auth path
jest.mock('@/src/services/firebase/config', () => ({
  __esModule: true,
  isConfigured: true,
  auth: mockAuth,
  app: {},
}));

// Import AFTER all jest.mock calls so the mock is in place
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { authService } = require('@/src/services/auth/authService');

const fakeFirebaseUser = {
  uid: 'firebase-uid-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
  emailVerified: true,
  reload: jest.fn(),
};

const expectedAuthUser = {
  uid: 'firebase-uid-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
  emailVerified: true,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.currentUser = null;
});

describe('authService (Firebase path)', () => {
  describe('getCurrentUser', () => {
    it('returns null when no user is signed in', () => {
      expect(authService.getCurrentUser()).toBeNull();
    });

    it('returns mapped user when signed in', () => {
      mockAuth.currentUser = fakeFirebaseUser;
      expect(authService.getCurrentUser()).toEqual(expectedAuthUser);
    });
  });

  describe('onAuthStateChange', () => {
    it('registers callback with Firebase onAuthStateChanged', () => {
      const callback = jest.fn();
      authService.onAuthStateChange(callback);
      expect(mockedOnAuthStateChanged).toHaveBeenCalled();
    });

    it('returns an unsubscribe function', () => {
      const mockUnsub = jest.fn();
      mockedOnAuthStateChanged.mockReturnValueOnce(mockUnsub);
      const unsubscribe = authService.onAuthStateChange(jest.fn());
      expect(unsubscribe).toBe(mockUnsub);
    });

    it('maps Firebase user to AuthUser in callback', () => {
      let firebaseCallback: (user: typeof fakeFirebaseUser | null) => void = () => {};
      mockedOnAuthStateChanged.mockImplementationOnce(
        (_auth: unknown, cb: typeof firebaseCallback) => {
          firebaseCallback = cb;
          return jest.fn();
        },
      );

      const callback = jest.fn();
      authService.onAuthStateChange(callback);
      firebaseCallback(fakeFirebaseUser);
      expect(callback).toHaveBeenCalledWith(expectedAuthUser);
    });

    it('passes null when no user', () => {
      let firebaseCallback: (user: null) => void = () => {};
      mockedOnAuthStateChanged.mockImplementationOnce(
        (_auth: unknown, cb: typeof firebaseCallback) => {
          firebaseCallback = cb;
          return jest.fn();
        },
      );

      const callback = jest.fn();
      authService.onAuthStateChange(callback);
      firebaseCallback(null);
      expect(callback).toHaveBeenCalledWith(null);
    });
  });

  describe('signUp', () => {
    it('creates user with email and password', async () => {
      mockedCreateUser.mockResolvedValueOnce({ user: fakeFirebaseUser });
      mockedSendEmailVerification.mockResolvedValueOnce(undefined);

      const result = await authService.signUp('test@example.com', 'password123');
      expect(mockedCreateUser).toHaveBeenCalledWith(mockAuth, 'test@example.com', 'password123');
      expect(mockedSendEmailVerification).toHaveBeenCalledWith(fakeFirebaseUser);
      expect(result).toEqual(expectedAuthUser);
    });

    it('updates profile with displayName when provided', async () => {
      mockedCreateUser.mockResolvedValueOnce({ user: fakeFirebaseUser });
      mockedUpdateProfile.mockResolvedValueOnce(undefined);
      mockedSendEmailVerification.mockResolvedValueOnce(undefined);

      await authService.signUp('test@example.com', 'password123', 'John Doe');
      expect(mockedUpdateProfile).toHaveBeenCalledWith(fakeFirebaseUser, {
        displayName: 'John Doe',
      });
    });

    it('skips profile update when no displayName', async () => {
      mockedCreateUser.mockResolvedValueOnce({ user: fakeFirebaseUser });
      mockedSendEmailVerification.mockResolvedValueOnce(undefined);

      await authService.signUp('test@example.com', 'password123');
      expect(mockedUpdateProfile).not.toHaveBeenCalled();
    });
  });

  describe('signIn', () => {
    it('signs in with email and password', async () => {
      mockedSignIn.mockResolvedValueOnce({ user: fakeFirebaseUser });

      const result = await authService.signIn('test@example.com', 'password123');
      expect(mockedSignIn).toHaveBeenCalledWith(mockAuth, 'test@example.com', 'password123');
      expect(result).toEqual(expectedAuthUser);
    });
  });

  describe('signInWithGoogle', () => {
    it('creates credential and signs in', async () => {
      const fakeCred = { providerId: 'google.com' };
      mockedGoogleCredential.mockReturnValueOnce(fakeCred);
      mockedSignInWithCredential.mockResolvedValueOnce({ user: fakeFirebaseUser });

      const result = await authService.signInWithGoogle('google-id-token');
      expect(mockedGoogleCredential).toHaveBeenCalledWith('google-id-token');
      expect(mockedSignInWithCredential).toHaveBeenCalledWith(mockAuth, fakeCred);
      expect(result).toEqual(expectedAuthUser);
    });
  });

  describe('signOut', () => {
    it('calls Firebase signOut', async () => {
      mockedSignOut.mockResolvedValueOnce(undefined);
      await authService.signOut();
      expect(mockedSignOut).toHaveBeenCalledWith(mockAuth);
    });
  });

  describe('sendVerificationEmail', () => {
    it('sends verification email to current user', async () => {
      mockAuth.currentUser = fakeFirebaseUser;
      mockedSendEmailVerification.mockResolvedValueOnce(undefined);

      await authService.sendVerificationEmail();
      expect(mockedSendEmailVerification).toHaveBeenCalledWith(fakeFirebaseUser);
    });

    it('does nothing when no current user', async () => {
      mockAuth.currentUser = null;
      await authService.sendVerificationEmail();
      expect(mockedSendEmailVerification).not.toHaveBeenCalled();
    });
  });

  describe('sendPasswordReset', () => {
    it('sends password reset email', async () => {
      mockedSendPasswordReset.mockResolvedValueOnce(undefined);
      await authService.sendPasswordReset('test@example.com');
      expect(mockedSendPasswordReset).toHaveBeenCalledWith(mockAuth, 'test@example.com');
    });
  });

  describe('updateUserProfile', () => {
    it('updates profile for current user', async () => {
      mockAuth.currentUser = fakeFirebaseUser;
      mockedUpdateProfile.mockResolvedValueOnce(undefined);

      await authService.updateUserProfile('New Name', 'https://new-photo.jpg');
      expect(mockedUpdateProfile).toHaveBeenCalledWith(fakeFirebaseUser, {
        displayName: 'New Name',
        photoURL: 'https://new-photo.jpg',
      });
    });

    it('does nothing when no current user', async () => {
      mockAuth.currentUser = null;
      await authService.updateUserProfile('Name');
      expect(mockedUpdateProfile).not.toHaveBeenCalled();
    });
  });

  describe('reloadUser', () => {
    it('reloads and returns mapped user', async () => {
      mockAuth.currentUser = fakeFirebaseUser;
      fakeFirebaseUser.reload.mockResolvedValueOnce(undefined);

      const result = await authService.reloadUser();
      expect(fakeFirebaseUser.reload).toHaveBeenCalled();
      expect(result).toEqual(expectedAuthUser);
    });

    it('returns null when no current user', async () => {
      mockAuth.currentUser = null;
      const result = await authService.reloadUser();
      expect(result).toBeNull();
    });
  });
});
