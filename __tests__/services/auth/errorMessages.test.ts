import { getAuthErrorMessage } from '@/src/services/auth/errorMessages';

describe('getAuthErrorMessage', () => {
  it('returns message for known error codes', () => {
    expect(getAuthErrorMessage({ code: 'auth/invalid-email' })).toBe('Invalid email address');
    expect(getAuthErrorMessage({ code: 'auth/user-disabled' })).toBe(
      'This account has been disabled',
    );
    expect(getAuthErrorMessage({ code: 'auth/user-not-found' })).toBe(
      'No account found with this email',
    );
    expect(getAuthErrorMessage({ code: 'auth/wrong-password' })).toBe('Incorrect password');
    expect(getAuthErrorMessage({ code: 'auth/invalid-credential' })).toBe(
      'Invalid email or password',
    );
    expect(getAuthErrorMessage({ code: 'auth/email-already-in-use' })).toBe(
      'An account with this email already exists',
    );
    expect(getAuthErrorMessage({ code: 'auth/weak-password' })).toBe('Password is too weak');
  });

  it('returns default message for unknown error code', () => {
    expect(getAuthErrorMessage({ code: 'auth/unknown-code' })).toBe(
      'An error occurred. Please try again.',
    );
  });

  it('returns default message for non-object errors', () => {
    expect(getAuthErrorMessage('string error')).toBe('An error occurred. Please try again.');
    expect(getAuthErrorMessage(null)).toBe('An error occurred. Please try again.');
    expect(getAuthErrorMessage(undefined)).toBe('An error occurred. Please try again.');
  });

  it('returns default message for objects without code property', () => {
    expect(getAuthErrorMessage({ message: 'something' })).toBe(
      'An error occurred. Please try again.',
    );
  });
});
