import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import LoginScreen from '@/app/auth/login';
import SignUpScreen from '@/app/auth/signup';
import ForgotPasswordScreen from '@/app/auth/forgot-password';
import VerifyEmailScreen from '@/app/auth/verify-email';

jest.mock('react-native-reanimated', () => require('../helpers/reanimatedMock').reanimatedMock);

// Mock useTheme at the source — avoids ThemeProvider async state issues
jest.mock('@/src/theme/ThemeContext', () => {
  const actual = jest.requireActual('@/src/theme/ThemeContext');
  return {
    ...actual,
    useTheme: () => ({
      colors: actual.lightColors,
      isDark: false,
      mode: 'light',
      setMode: jest.fn(),
    }),
  };
});

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success' },
}));

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush, replace: mockReplace }),
}));

const mockSignIn = jest.fn();
const mockSignUp = jest.fn();
const mockSignInWithGoogle = jest.fn();
const mockSignOut = jest.fn();
const mockSendPasswordReset = jest.fn();
const mockSendVerificationEmail = jest.fn();
const mockReloadUser = jest.fn();
let mockIsLoading = false;
let mockUser: { email: string; emailVerified: boolean } | null = null;

jest.mock('@/src/store', () => ({
  useAuthStore: () => ({
    signIn: mockSignIn,
    signUp: mockSignUp,
    signInWithGoogle: mockSignInWithGoogle,
    signOut: mockSignOut,
    sendPasswordReset: mockSendPasswordReset,
    sendVerificationEmail: mockSendVerificationEmail,
    reloadUser: mockReloadUser,
    isLoading: mockIsLoading,
    user: mockUser,
  }),
}));

const mockPromptAsync = jest.fn();
jest.mock('@/src/services/auth', () => ({
  useGoogleAuth: () => ({
    request: {},
    response: null,
    promptAsync: mockPromptAsync,
  }),
  getAuthErrorMessage: (err: unknown) => (err instanceof Error ? err.message : 'Unknown error'),
}));

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return {
    ArrowLeft: (props: Record<string, unknown>) => <View testID="arrow-left" {...props} />,
    Mail: (props: Record<string, unknown>) => <View testID="mail-icon" {...props} />,
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  mockIsLoading = false;
  mockUser = null;
});

// ─── Login Screen ────────────────────────────────────────────────────────────

describe('LoginScreen', () => {
  it('renders title and form fields', () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    expect(getByText('Welcome Back')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('shows validation error when fields are empty', () => {
    jest.spyOn(Alert, 'alert');
    const { getByText } = render(<LoginScreen />);
    fireEvent.press(getByText('Sign In'));
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter both email and password');
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('calls signIn with email and password', async () => {
    mockSignIn.mockResolvedValueOnce(undefined);
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Sign In'));
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('shows error alert on signIn failure', async () => {
    jest.spyOn(Alert, 'alert');
    mockSignIn.mockRejectedValueOnce(new Error('Invalid credentials'));
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'wrong');
    fireEvent.press(getByText('Sign In'));
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Login Failed', 'Invalid credentials');
    });
  });

  it('navigates to signup screen', () => {
    const { getByText } = render(<LoginScreen />);
    fireEvent.press(getByText('Sign Up'));
    expect(mockPush).toHaveBeenCalledWith('/auth/signup');
  });

  it('navigates to forgot password screen', () => {
    const { getByText } = render(<LoginScreen />);
    fireEvent.press(getByText('Forgot Password?'));
    expect(mockPush).toHaveBeenCalledWith('/auth/forgot-password');
  });

  it('renders Google sign-in button', () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText('Continue with Google')).toBeTruthy();
  });
});

// ─── SignUp Screen ───────────────────────────────────────────────────────────

describe('SignUpScreen', () => {
  // "Create Account" appears as both the title and button text
  const pressCreateAccount = (getAllByText: (text: string) => { props: unknown }[]) => {
    const elements = getAllByText('Create Account');
    fireEvent.press(elements[elements.length - 1]); // button is last
  };

  it('renders title and form fields', () => {
    const { getAllByText, getByPlaceholderText } = render(<SignUpScreen />);
    expect(getAllByText('Create Account').length).toBeGreaterThanOrEqual(1);
    expect(getByPlaceholderText('Full Name')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByPlaceholderText('Confirm Password')).toBeTruthy();
  });

  it('shows validation error when name is empty', () => {
    jest.spyOn(Alert, 'alert');
    const { getAllByText } = render(<SignUpScreen />);
    pressCreateAccount(getAllByText);
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter your name');
  });

  it('shows validation error when passwords do not match', () => {
    jest.spyOn(Alert, 'alert');
    const { getAllByText, getByPlaceholderText } = render(<SignUpScreen />);
    fireEvent.changeText(getByPlaceholderText('Full Name'), 'John');
    fireEvent.changeText(getByPlaceholderText('Email'), 'john@test.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'different');
    pressCreateAccount(getAllByText);
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Passwords do not match');
  });

  it('shows validation error for short password', () => {
    jest.spyOn(Alert, 'alert');
    const { getAllByText, getByPlaceholderText } = render(<SignUpScreen />);
    fireEvent.changeText(getByPlaceholderText('Full Name'), 'John');
    fireEvent.changeText(getByPlaceholderText('Email'), 'john@test.com');
    fireEvent.changeText(getByPlaceholderText('Password'), '12345');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), '12345');
    pressCreateAccount(getAllByText);
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Password must be at least 6 characters');
  });

  it('calls signUp on valid submission', async () => {
    mockSignUp.mockResolvedValueOnce(undefined);
    jest.spyOn(Alert, 'alert');
    const { getAllByText, getByPlaceholderText } = render(<SignUpScreen />);
    fireEvent.changeText(getByPlaceholderText('Full Name'), 'John Doe');
    fireEvent.changeText(getByPlaceholderText('Email'), 'john@test.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'password123');
    pressCreateAccount(getAllByText);
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('john@test.com', 'password123', 'John Doe');
    });
  });

  it('navigates to login screen', () => {
    const { getByText } = render(<SignUpScreen />);
    fireEvent.press(getByText('Sign In'));
    expect(mockPush).toHaveBeenCalledWith('/auth/login');
  });
});

// ─── Forgot Password Screen ─────────────────────────────────────────────────

describe('ForgotPasswordScreen', () => {
  it('renders title and email input', () => {
    const { getByText, getByPlaceholderText } = render(<ForgotPasswordScreen />);
    expect(getByText('Reset Password')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByText('Send Reset Link')).toBeTruthy();
  });

  it('shows validation error when email is empty', () => {
    jest.spyOn(Alert, 'alert');
    const { getByText } = render(<ForgotPasswordScreen />);
    fireEvent.press(getByText('Send Reset Link'));
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter your email address');
  });

  it('calls sendPasswordReset and shows success view', async () => {
    mockSendPasswordReset.mockResolvedValueOnce(undefined);
    const { getByText, getByPlaceholderText, findByText } = render(<ForgotPasswordScreen />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.press(getByText('Send Reset Link'));
    await waitFor(() => {
      expect(mockSendPasswordReset).toHaveBeenCalledWith('test@example.com');
    });
    expect(await findByText('Check Your Email')).toBeTruthy();
  });

  it('shows error on reset failure', async () => {
    jest.spyOn(Alert, 'alert');
    mockSendPasswordReset.mockRejectedValueOnce(new Error('User not found'));
    const { getByText, getByPlaceholderText } = render(<ForgotPasswordScreen />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'bad@example.com');
    fireEvent.press(getByText('Send Reset Link'));
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'User not found');
    });
  });
});

// ─── Verify Email Screen ────────────────────────────────────────────────────

describe('VerifyEmailScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockUser = { email: 'test@example.com', emailVerified: false };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders title and user email', () => {
    const { getByText } = render(<VerifyEmailScreen />);
    expect(getByText('Verify Your Email')).toBeTruthy();
    expect(getByText('test@example.com')).toBeTruthy();
  });

  it('renders action buttons', () => {
    const { getByText } = render(<VerifyEmailScreen />);
    expect(getByText("I've Verified My Email")).toBeTruthy();
    expect(getByText('Resend Verification Email')).toBeTruthy();
    expect(getByText('Sign Out')).toBeTruthy();
  });

  it('calls reloadUser when checking verification', async () => {
    jest.useRealTimers();
    mockReloadUser.mockResolvedValue(undefined);
    jest.spyOn(Alert, 'alert');
    const { getByText } = render(<VerifyEmailScreen />);
    fireEvent.press(getByText("I've Verified My Email"));
    await waitFor(() => {
      expect(mockReloadUser).toHaveBeenCalled();
    });
  });

  it('calls sendVerificationEmail on resend', async () => {
    jest.useRealTimers();
    mockSendVerificationEmail.mockResolvedValueOnce(undefined);
    jest.spyOn(Alert, 'alert');
    const { getByText } = render(<VerifyEmailScreen />);
    fireEvent.press(getByText('Resend Verification Email'));
    await waitFor(() => {
      expect(mockSendVerificationEmail).toHaveBeenCalled();
    });
  });

  it('calls signOut and navigates to login', async () => {
    jest.useRealTimers();
    mockSignOut.mockResolvedValueOnce(undefined);
    const { getByText } = render(<VerifyEmailScreen />);
    fireEvent.press(getByText('Sign Out'));
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/auth/login');
    });
  });
});
