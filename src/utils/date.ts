import { format, parseISO, startOfDay, endOfDay, differenceInMinutes, isToday, isYesterday, subDays, addDays } from 'date-fns';

export function formatDate(date: Date | string, formatStr: string = 'yyyy-MM-dd'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr);
}

export function getDateString(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd');
}

export function parseDate(dateString: string): Date {
  return parseISO(dateString);
}

export function getStartOfDay(date: Date = new Date()): Date {
  return startOfDay(date);
}

export function getEndOfDay(date: Date = new Date()): Date {
  return endOfDay(date);
}

export function getDurationMinutes(start: Date | string, end: Date | string): number {
  const startDate = typeof start === 'string' ? parseISO(start) : start;
  const endDate = typeof end === 'string' ? parseISO(end) : end;
  return differenceInMinutes(endDate, startDate);
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'h:mm a');
}

export function getRelativeDateLabel(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEEE, MMM d');
}

export function getWeekDates(referenceDate: Date = new Date()): Date[] {
  const dates: Date[] = [];
  for (let i = 6; i >= 0; i--) {
    dates.push(subDays(referenceDate, i));
  }
  return dates;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
