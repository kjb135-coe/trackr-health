const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'Invalid email address',
  'auth/user-disabled': 'This account has been disabled',
  'auth/user-not-found': 'No account found with this email',
  'auth/wrong-password': 'Incorrect password',
  'auth/invalid-credential': 'Invalid email or password',
  'auth/email-already-in-use': 'An account with this email already exists',
  'auth/weak-password': 'Password is too weak',
};

/**
 * Extract a Firebase auth error code from an unknown error and return a user-friendly message.
 */
export function getAuthErrorMessage(error: unknown): string {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  return AUTH_ERROR_MESSAGES[code] ?? 'An error occurred. Please try again.';
}
