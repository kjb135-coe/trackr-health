import {
  getDateString,
  formatDuration,
  getErrorMessage,
  getRelativeDateLabel,
} from '@/src/utils/date';

describe('getDateString', () => {
  it('returns today in YYYY-MM-DD format', () => {
    const result = getDateString(new Date(2024, 0, 15));
    expect(result).toBe('2024-01-15');
  });

  it('returns current date when no argument provided', () => {
    const result = getDateString();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('formatDuration', () => {
  it('returns minutes only when under 60', () => {
    expect(formatDuration(45)).toBe('45m');
  });

  it('returns hours only when exact hours', () => {
    expect(formatDuration(120)).toBe('2h');
  });

  it('returns hours and minutes', () => {
    expect(formatDuration(90)).toBe('1h 30m');
  });

  it('handles zero minutes', () => {
    expect(formatDuration(0)).toBe('0m');
  });
});

describe('getErrorMessage', () => {
  it('extracts message from Error objects', () => {
    expect(getErrorMessage(new Error('test error'))).toBe('test error');
  });

  it('returns string errors directly', () => {
    expect(getErrorMessage('string error')).toBe('string error');
  });

  it('returns fallback for unknown types', () => {
    expect(getErrorMessage(42)).toBe('An unexpected error occurred');
    expect(getErrorMessage(null)).toBe('An unexpected error occurred');
    expect(getErrorMessage(undefined)).toBe('An unexpected error occurred');
  });
});

describe('getRelativeDateLabel', () => {
  it('returns "Today" for current date', () => {
    expect(getRelativeDateLabel(new Date())).toBe('Today');
  });
});
