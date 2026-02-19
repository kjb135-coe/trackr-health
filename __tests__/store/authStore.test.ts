import { useAuthStore } from '@/src/store/authStore';
import { authService } from '@/src/services/auth';
import { act } from '@testing-library/react-native';

jest.mock('@/src/services/auth', () => ({
  authService: {
    onAuthStateChange: jest.fn(),
    signUp: jest.fn(),
    signIn: jest.fn(),
    signInWithGoogle: jest.fn(),
    signOut: jest.fn(),
    sendVerificationEmail: jest.fn(),
    sendPasswordReset: jest.fn(),
    reloadUser: jest.fn(),
  },
}));

const mockUser = {
  uid: 'user_1',
  email: 'test@test.com',
  displayName: 'Test User',
  photoURL: null,
  emailVerified: true,
};

describe('authStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      useAuthStore.setState({
        user: null,
        isLoading: false,
        isInitialized: false,
        error: null,
      });
    });
  });

  it('has correct initial state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.isInitialized).toBe(false);
    expect(state.error).toBeNull();
  });

  it('initialize sets up auth state listener', () => {
    const mockUnsubscribe = jest.fn();
    (authService.onAuthStateChange as jest.Mock).mockImplementation((cb) => {
      cb(mockUser);
      return mockUnsubscribe;
    });

    const unsubscribe = useAuthStore.getState().initialize();

    expect(authService.onAuthStateChange).toHaveBeenCalled();
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().isInitialized).toBe(true);
    expect(useAuthStore.getState().isLoading).toBe(false);

    unsubscribe();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('signUp sets user on success', async () => {
    (authService.signUp as jest.Mock).mockResolvedValue(mockUser);

    await useAuthStore.getState().signUp('test@test.com', 'password', 'Test User');

    expect(authService.signUp).toHaveBeenCalledWith('test@test.com', 'password', 'Test User');
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().isLoading).toBe(false);
    expect(useAuthStore.getState().error).toBeNull();
  });

  it('signUp sets error on failure', async () => {
    (authService.signUp as jest.Mock).mockRejectedValue(new Error('Email already in use'));

    await expect(useAuthStore.getState().signUp('test@test.com', 'password')).rejects.toThrow(
      'Email already in use',
    );

    expect(useAuthStore.getState().error).toBe('Email already in use');
    expect(useAuthStore.getState().isLoading).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('signIn sets user on success', async () => {
    (authService.signIn as jest.Mock).mockResolvedValue(mockUser);

    await useAuthStore.getState().signIn('test@test.com', 'password');

    expect(authService.signIn).toHaveBeenCalledWith('test@test.com', 'password');
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('signIn sets error on failure', async () => {
    (authService.signIn as jest.Mock).mockRejectedValue(new Error('Invalid password'));

    await expect(useAuthStore.getState().signIn('test@test.com', 'wrong')).rejects.toThrow(
      'Invalid password',
    );

    expect(useAuthStore.getState().error).toBe('Invalid password');
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('signInWithGoogle sets user on success', async () => {
    (authService.signInWithGoogle as jest.Mock).mockResolvedValue(mockUser);

    await useAuthStore.getState().signInWithGoogle('google-id-token');

    expect(authService.signInWithGoogle).toHaveBeenCalledWith('google-id-token');
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  it('signInWithGoogle sets error on failure', async () => {
    (authService.signInWithGoogle as jest.Mock).mockRejectedValue(new Error('Google auth failed'));

    await expect(useAuthStore.getState().signInWithGoogle('bad-token')).rejects.toThrow(
      'Google auth failed',
    );

    expect(useAuthStore.getState().error).toBe('Google auth failed');
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('signOut clears user on success', async () => {
    (authService.signOut as jest.Mock).mockResolvedValue(undefined);
    act(() => useAuthStore.setState({ user: mockUser }));

    await useAuthStore.getState().signOut();

    expect(authService.signOut).toHaveBeenCalled();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('signOut sets error on failure', async () => {
    (authService.signOut as jest.Mock).mockRejectedValue(new Error('Network error'));

    await expect(useAuthStore.getState().signOut()).rejects.toThrow('Network error');

    expect(useAuthStore.getState().error).toBe('Network error');
  });

  it('sendVerificationEmail calls service', async () => {
    (authService.sendVerificationEmail as jest.Mock).mockResolvedValue(undefined);

    await useAuthStore.getState().sendVerificationEmail();

    expect(authService.sendVerificationEmail).toHaveBeenCalled();
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('sendVerificationEmail sets error on failure', async () => {
    (authService.sendVerificationEmail as jest.Mock).mockRejectedValue(
      new Error('Verification failed'),
    );

    await expect(useAuthStore.getState().sendVerificationEmail()).rejects.toThrow(
      'Verification failed',
    );

    expect(useAuthStore.getState().error).toBe('Verification failed');
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('sendPasswordReset calls service with email', async () => {
    (authService.sendPasswordReset as jest.Mock).mockResolvedValue(undefined);

    await useAuthStore.getState().sendPasswordReset('test@test.com');

    expect(authService.sendPasswordReset).toHaveBeenCalledWith('test@test.com');
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('sendPasswordReset sets error on failure', async () => {
    (authService.sendPasswordReset as jest.Mock).mockRejectedValue(new Error('Reset failed'));

    await expect(useAuthStore.getState().sendPasswordReset('test@test.com')).rejects.toThrow(
      'Reset failed',
    );

    expect(useAuthStore.getState().error).toBe('Reset failed');
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('reloadUser updates user state', async () => {
    (authService.reloadUser as jest.Mock).mockResolvedValue(mockUser);

    await useAuthStore.getState().reloadUser();

    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  it('reloadUser silently fails on error', async () => {
    act(() => useAuthStore.setState({ user: mockUser }));
    (authService.reloadUser as jest.Mock).mockRejectedValue(new Error('Network error'));

    await useAuthStore.getState().reloadUser();

    // User should remain unchanged - silent fail
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().error).toBeNull();
  });

  it('clearError clears the error state', () => {
    act(() => useAuthStore.setState({ error: 'Some error' }));

    useAuthStore.getState().clearError();

    expect(useAuthStore.getState().error).toBeNull();
  });
});
