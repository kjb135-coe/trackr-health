import {
  getDateString,
  formatDate,
  parseDate,
  getStartOfDay,
  getEndOfDay,
  getDurationMinutes,
  formatDuration,
  formatTime,
  getErrorMessage,
  getRelativeDateLabel,
  generateId,
  safeJsonParse,
} from '@/src/utils/date';
import { subDays } from 'date-fns';

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

describe('formatDate', () => {
  it('formats Date object with default format', () => {
    expect(formatDate(new Date(2024, 5, 15))).toBe('2024-06-15');
  });

  it('formats ISO string input', () => {
    expect(formatDate('2024-03-20')).toBe('2024-03-20');
  });

  it('accepts custom format string', () => {
    expect(formatDate(new Date(2024, 0, 1), 'MMM d, yyyy')).toBe('Jan 1, 2024');
  });
});

describe('parseDate', () => {
  it('parses ISO date string to Date', () => {
    const result = parseDate('2024-06-15');
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(5); // 0-indexed
    expect(result.getDate()).toBe(15);
  });
});

describe('getStartOfDay', () => {
  it('returns start of day (midnight)', () => {
    const result = getStartOfDay(new Date(2024, 5, 15, 14, 30));
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
  });
});

describe('getEndOfDay', () => {
  it('returns end of day (23:59:59)', () => {
    const result = getEndOfDay(new Date(2024, 5, 15, 14, 30));
    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
    expect(result.getSeconds()).toBe(59);
  });
});

describe('getDurationMinutes', () => {
  it('calculates minutes between two Date objects', () => {
    const start = new Date(2024, 5, 15, 10, 0);
    const end = new Date(2024, 5, 15, 11, 30);
    expect(getDurationMinutes(start, end)).toBe(90);
  });

  it('calculates minutes between two ISO strings', () => {
    expect(getDurationMinutes('2024-06-15T10:00:00', '2024-06-15T12:00:00')).toBe(120);
  });
});

describe('formatTime', () => {
  it('formats Date to 12-hour time', () => {
    const result = formatTime(new Date(2024, 5, 15, 14, 30));
    expect(result).toBe('2:30 PM');
  });

  it('formats ISO string to 12-hour time', () => {
    const result = formatTime('2024-06-15T08:15:00');
    expect(result).toBe('8:15 AM');
  });
});

describe('getRelativeDateLabel', () => {
  it('returns "Today" for current date', () => {
    expect(getRelativeDateLabel(new Date())).toBe('Today');
  });

  it('returns "Yesterday" for previous day', () => {
    expect(getRelativeDateLabel(subDays(new Date(), 1))).toBe('Yesterday');
  });

  it('returns formatted date for older dates', () => {
    const result = getRelativeDateLabel(new Date(2024, 0, 1));
    expect(result).toMatch(/Monday, Jan 1/);
  });

  it('accepts ISO string input', () => {
    expect(getRelativeDateLabel(getDateString())).toBe('Today');
  });
});

describe('generateId', () => {
  it('returns a non-empty string', () => {
    const id = generateId();
    expect(id.length).toBeGreaterThan(0);
  });

  it('generates unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });
});

describe('safeJsonParse', () => {
  it('parses valid JSON', () => {
    expect(safeJsonParse<string[]>('["a","b"]')).toEqual(['a', 'b']);
  });

  it('returns undefined for null', () => {
    expect(safeJsonParse(null)).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(safeJsonParse('')).toBeUndefined();
  });

  it('returns undefined for invalid JSON', () => {
    expect(safeJsonParse('{not json}')).toBeUndefined();
  });
});
