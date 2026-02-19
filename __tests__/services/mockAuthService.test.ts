import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

// Must import after mocking AsyncStorage
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { authService, useGoogleAuth } = require('@/src/services/auth/mockAuthService');

describe('mockAuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('signUp creates and saves a user', async () => {
    const user = await authService.signUp('test@test.com', 'password', 'Test');
    expect(user.email).toBe('test@test.com');
    expect(user.displayName).toBe('Test');
    expect(user.emailVerified).toBe(false);
    expect(user.uid).toMatch(/^local_/);
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it('signUp defaults displayName from email', async () => {
    const user = await authService.signUp('hello@example.com', 'pass');
    expect(user.displayName).toBe('hello');
  });

  it('signIn creates a verified user', async () => {
    const user = await authService.signIn('user@test.com', 'pass');
    expect(user.email).toBe('user@test.com');
    expect(user.emailVerified).toBe(true);
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it('signInWithGoogle creates a google user', async () => {
    const user = await authService.signInWithGoogle('google-token');
    expect(user.uid).toMatch(/^google_/);
    expect(user.email).toBe('user@gmail.com');
    expect(user.displayName).toBe('Google User');
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it('signOut clears stored user', async () => {
    await authService.signIn('user@test.com', 'pass');
    await authService.signOut();
    expect(AsyncStorage.removeItem).toHaveBeenCalled();
    expect(authService.getCurrentUser()).toBeNull();
  });

  it('onAuthStateChange loads stored user and notifies callback', async () => {
    const storedUser = {
      uid: 'stored_1',
      email: 'stored@test.com',
      displayName: 'Stored',
      photoURL: null,
      emailVerified: true,
    };
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(storedUser));

    const callback = jest.fn();
    const unsubscribe = authService.onAuthStateChange(callback);

    // Wait for async loadStoredUser
    await new Promise((r) => setTimeout(r, 10));

    expect(callback).toHaveBeenCalledWith(storedUser);
    unsubscribe();
  });

  it('onAuthStateChange handles missing stored user', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const callback = jest.fn();
    const unsubscribe = authService.onAuthStateChange(callback);

    await new Promise((r) => setTimeout(r, 10));

    expect(callback).toHaveBeenCalledWith(null);
    unsubscribe();
  });

  it('sendVerificationEmail and sendPasswordReset are no-ops', async () => {
    await expect(authService.sendVerificationEmail()).resolves.toBeUndefined();
    await expect(authService.sendPasswordReset('test@test.com')).resolves.toBeUndefined();
  });

  it('reloadUser returns current user', async () => {
    await authService.signIn('test@test.com', 'pass');
    const user = await authService.reloadUser();
    expect(user?.email).toBe('test@test.com');
  });

  it('updateUserProfile updates current user', async () => {
    await authService.signIn('test@test.com', 'pass');
    await authService.updateUserProfile('New Name', 'https://photo.url');
    const user = authService.getCurrentUser();
    expect(user?.displayName).toBe('New Name');
    expect(user?.photoURL).toBe('https://photo.url');
  });

  it('updateUserProfile preserves fields when params are undefined', async () => {
    await authService.signIn('test@test.com', 'pass');
    await authService.updateUserProfile(undefined, undefined);
    const user = authService.getCurrentUser();
    expect(user?.displayName).toBe('test');
    expect(user?.photoURL).toBeNull();
  });

  it('updateUserProfile does nothing when not signed in', async () => {
    await authService.signOut();
    await authService.updateUserProfile('Name', 'photo.url');
    expect(authService.getCurrentUser()).toBeNull();
  });

  it('useGoogleAuth returns mock structure', () => {
    const result = useGoogleAuth();
    expect(result.request).toBeNull();
    expect(result.response).toBeNull();
    expect(typeof result.promptAsync).toBe('function');
  });
});
