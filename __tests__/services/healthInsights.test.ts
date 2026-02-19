import {
  getWeeklyStats,
  getDailyStreak,
  getTrendData,
} from '@/src/services/insights/healthInsights';
import { getDateString } from '@/src/utils/date';
import { subDays } from 'date-fns';

const mockGetAllHabits = jest.fn();
const mockGetCompletionsForDateRange = jest.fn();
const mockGetByDateRangeSleep = jest.fn();
const mockGetByDateRangeExercise = jest.fn();
const mockGetMealsByDateRange = jest.fn();

jest.mock('@/src/database/repositories', () => ({
  habitRepository: {
    getAll: (...args: unknown[]) => mockGetAllHabits(...args),
    getCompletionsForDateRange: (...args: unknown[]) => mockGetCompletionsForDateRange(...args),
  },
  sleepRepository: {
    getByDateRange: (...args: unknown[]) => mockGetByDateRangeSleep(...args),
  },
  exerciseRepository: {
    getByDateRange: (...args: unknown[]) => mockGetByDateRangeExercise(...args),
  },
  nutritionRepository: {
    getMealsByDateRange: (...args: unknown[]) => mockGetMealsByDateRange(...args),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockGetAllHabits.mockResolvedValue([]);
  mockGetCompletionsForDateRange.mockResolvedValue([]);
  mockGetByDateRangeSleep.mockResolvedValue([]);
  mockGetByDateRangeExercise.mockResolvedValue([]);
  mockGetMealsByDateRange.mockResolvedValue([]);
});

describe('getWeeklyStats', () => {
  it('returns zeroed stats when no data exists', async () => {
    const stats = await getWeeklyStats(new Date('2026-02-16'));

    expect(stats.habitsCompleted).toBe(0);
    expect(stats.habitsTotal).toBe(0);
    expect(stats.avgSleepHours).toBe(0);
    expect(stats.totalExerciseMinutes).toBe(0);
    expect(stats.avgDailyCalories).toBe(0);
    expect(stats.daysTracked).toBe(0);
  });

  it('calculates habit completion rate correctly', async () => {
    mockGetAllHabits.mockResolvedValue([{ id: '1' }, { id: '2' }]);
    mockGetCompletionsForDateRange.mockResolvedValue([
      { habitId: '1', date: '2026-02-16', completed: true },
      { habitId: '1', date: '2026-02-17', completed: true },
      { habitId: '2', date: '2026-02-16', completed: false },
    ]);

    const stats = await getWeeklyStats(new Date('2026-02-16'));

    expect(stats.habitsCompleted).toBe(2);
    expect(stats.habitsTotal).toBe(14); // 2 habits * 7 days
    expect(stats.habitCompletionRate).toBeCloseTo(2 / 14);
  });

  it('calculates sleep averages correctly', async () => {
    mockGetByDateRangeSleep.mockResolvedValue([
      { date: '2026-02-16', durationMinutes: 480, quality: 4 },
      { date: '2026-02-17', durationMinutes: 420, quality: 3 },
    ]);

    const stats = await getWeeklyStats(new Date('2026-02-16'));

    expect(stats.avgSleepHours).toBe(7.5);
    expect(stats.avgSleepQuality).toBe(3.5);
  });

  it('sums exercise minutes for the week', async () => {
    mockGetByDateRangeExercise.mockResolvedValue([
      { date: '2026-02-16', durationMinutes: 30 },
      { date: '2026-02-17', durationMinutes: 45 },
    ]);

    const stats = await getWeeklyStats(new Date('2026-02-16'));

    expect(stats.totalExerciseMinutes).toBe(75);
  });

  it('calculates average daily calories across unique days', async () => {
    mockGetMealsByDateRange.mockResolvedValue([
      { date: '2026-02-16', totalCalories: 800 },
      { date: '2026-02-16', totalCalories: 600 },
      { date: '2026-02-17', totalCalories: 1200 },
    ]);

    const stats = await getWeeklyStats(new Date('2026-02-16'));

    expect(stats.avgDailyCalories).toBe(1300); // (800 + 600 + 1200) / 2 unique days
  });

  it('uses batch queries instead of N+1 pattern', async () => {
    mockGetAllHabits.mockResolvedValue([{ id: '1' }, { id: '2' }, { id: '3' }]);

    await getWeeklyStats(new Date('2026-02-16'));

    expect(mockGetCompletionsForDateRange).toHaveBeenCalledTimes(1);
  });
});

describe('getDailyStreak', () => {
  it('returns 0 when no activity exists', async () => {
    const streak = await getDailyStreak();

    expect(streak).toBe(0);
  });

  it('counts consecutive days with any activity', async () => {
    const today = new Date();
    const dates = Array.from({ length: 5 }, (_, i) => getDateString(subDays(today, i)));

    mockGetByDateRangeSleep.mockResolvedValue(dates.map((date) => ({ date })));

    const streak = await getDailyStreak();

    expect(streak).toBe(5);
  });

  it('fetches data with bounded date range (no full table scan)', async () => {
    await getDailyStreak();

    expect(mockGetByDateRangeSleep).toHaveBeenCalledTimes(1);
    expect(mockGetByDateRangeExercise).toHaveBeenCalledTimes(1);
    expect(mockGetMealsByDateRange).toHaveBeenCalledTimes(1);
  });

  it('breaks streak when a day has no activity', async () => {
    const todayStr = getDateString(new Date());
    mockGetByDateRangeExercise.mockResolvedValue([{ date: todayStr }]);

    const streak = await getDailyStreak();

    expect(streak).toBe(1);
  });

  it('counts meals toward streak', async () => {
    const today = new Date();
    const dates = Array.from({ length: 3 }, (_, i) => getDateString(subDays(today, i)));

    mockGetMealsByDateRange.mockResolvedValue(dates.map((date) => ({ date, totalCalories: 500 })));

    const streak = await getDailyStreak();

    expect(streak).toBe(3);
  });
});

describe('getTrendData', () => {
  it('returns trend data with both weeks', async () => {
    const data = await getTrendData();

    expect(data.thisWeek).toBeDefined();
    expect(data.lastWeek).toBeDefined();
    expect(['up', 'down', 'stable']).toContain(data.sleepTrend);
    expect(['up', 'down', 'stable']).toContain(data.exerciseTrend);
    expect(['up', 'down', 'stable']).toContain(data.habitTrend);
  });

  it('detects upward trends when this week improves over last week', async () => {
    // First call for this week returns data, second call for last week returns less data
    let callCount = 0;
    mockGetByDateRangeSleep.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve([{ date: '2026-02-16', durationMinutes: 540, quality: 4 }]);
      }
      return Promise.resolve([{ date: '2026-02-09', durationMinutes: 360, quality: 2 }]);
    });

    const data = await getTrendData();

    expect(data.sleepTrend).toBe('up');
  });

  it('detects downward trends when this week declines', async () => {
    let callCount = 0;
    mockGetByDateRangeExercise.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve([{ date: '2026-02-16', durationMinutes: 20 }]);
      }
      return Promise.resolve([{ date: '2026-02-09', durationMinutes: 100 }]);
    });

    const data = await getTrendData();

    expect(data.exerciseTrend).toBe('down');
  });

  it('detects stable trends when change is within threshold', async () => {
    let callCount = 0;
    mockGetByDateRangeSleep.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve([{ date: '2026-02-16', durationMinutes: 480, quality: 4 }]);
      }
      return Promise.resolve([{ date: '2026-02-09', durationMinutes: 475, quality: 4 }]);
    });

    const data = await getTrendData();

    expect(data.sleepTrend).toBe('stable');
  });
});
