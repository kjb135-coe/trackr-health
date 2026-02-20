import { getWeeklyStats, getDailyStreak } from '@/src/services/insights/healthInsights';

jest.mock('@/src/database/repositories', () => ({
  habitRepository: {
    getAll: jest.fn(),
    getCompletionsForHabit: jest.fn(),
  },
  sleepRepository: {
    getAll: jest.fn(),
  },
  exerciseRepository: {
    getAll: jest.fn(),
  },
  nutritionRepository: {
    getAllMeals: jest.fn(),
  },
}));

const { habitRepository, sleepRepository, exerciseRepository, nutritionRepository } =
  jest.requireMock('@/src/database/repositories');

beforeEach(() => {
  jest.clearAllMocks();
  habitRepository.getAll.mockResolvedValue([]);
  habitRepository.getCompletionsForHabit.mockResolvedValue([]);
  sleepRepository.getAll.mockResolvedValue([]);
  exerciseRepository.getAll.mockResolvedValue([]);
  nutritionRepository.getAllMeals.mockResolvedValue([]);
});

describe('getWeeklyStats', () => {
  it('returns zeros when no data exists', async () => {
    const stats = await getWeeklyStats(new Date('2026-02-18'));

    expect(stats.habitsCompleted).toBe(0);
    expect(stats.habitsTotal).toBe(0);
    expect(stats.habitCompletionRate).toBe(0);
    expect(stats.avgSleepHours).toBe(0);
    expect(stats.avgSleepQuality).toBe(0);
    expect(stats.totalExerciseMinutes).toBe(0);
    expect(stats.avgDailyCalories).toBe(0);
    expect(stats.daysTracked).toBe(0);
  });

  it('calculates habit completions for the week', async () => {
    habitRepository.getAll.mockResolvedValue([{ id: 'h1', name: 'Meditate', frequency: 'daily' }]);
    habitRepository.getCompletionsForHabit.mockResolvedValue([
      { completed: true },
      { completed: true },
      { completed: false },
    ]);

    const stats = await getWeeklyStats(new Date('2026-02-18'));

    expect(stats.habitsCompleted).toBe(2);
    expect(stats.habitsTotal).toBe(7);
    expect(stats.habitCompletionRate).toBeCloseTo(2 / 7);
  });

  it('calculates sleep averages for entries in range', async () => {
    sleepRepository.getAll.mockResolvedValue([
      { date: '2026-02-17', durationMinutes: 480, quality: 4 },
      { date: '2026-02-18', durationMinutes: 420, quality: 3 },
      { date: '2026-01-01', durationMinutes: 600, quality: 5 }, // out of range
    ]);

    const stats = await getWeeklyStats(new Date('2026-02-18'));

    expect(stats.avgSleepHours).toBeCloseTo((480 + 420) / 2 / 60);
    expect(stats.avgSleepQuality).toBeCloseTo((4 + 3) / 2);
  });

  it('calculates exercise total minutes for the week', async () => {
    exerciseRepository.getAll.mockResolvedValue([
      { date: '2026-02-17', durationMinutes: 45 },
      { date: '2026-02-19', durationMinutes: 30 },
    ]);

    const stats = await getWeeklyStats(new Date('2026-02-18'));

    expect(stats.totalExerciseMinutes).toBe(75);
  });

  it('calculates average daily calories from meals', async () => {
    nutritionRepository.getAllMeals.mockResolvedValue([
      { date: '2026-02-17', totalCalories: 500 },
      { date: '2026-02-17', totalCalories: 700 },
      { date: '2026-02-18', totalCalories: 600 },
    ]);

    const stats = await getWeeklyStats(new Date('2026-02-18'));

    // 2 unique days, 1800 total => 900 avg
    expect(stats.avgDailyCalories).toBe(900);
  });

  it('counts unique days tracked across all sources', async () => {
    sleepRepository.getAll.mockResolvedValue([
      { date: '2026-02-17', durationMinutes: 480, quality: 4 },
    ]);
    exerciseRepository.getAll.mockResolvedValue([
      { date: '2026-02-17', durationMinutes: 30 },
      { date: '2026-02-18', durationMinutes: 45 },
    ]);
    nutritionRepository.getAllMeals.mockResolvedValue([{ date: '2026-02-19', totalCalories: 500 }]);

    const stats = await getWeeklyStats(new Date('2026-02-18'));

    expect(stats.daysTracked).toBe(3);
  });

  it('fetches data in parallel (calls each repo once)', async () => {
    await getWeeklyStats(new Date('2026-02-18'));

    expect(sleepRepository.getAll).toHaveBeenCalledTimes(1);
    expect(exerciseRepository.getAll).toHaveBeenCalledTimes(1);
    expect(nutritionRepository.getAllMeals).toHaveBeenCalledTimes(1);
  });
});

describe('getDailyStreak', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-02-20'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns 0 when no activity exists', async () => {
    const streak = await getDailyStreak();
    expect(streak).toBe(0);
  });

  it('counts consecutive days from today backwards', async () => {
    sleepRepository.getAll.mockResolvedValue([
      { date: '2026-02-20' },
      { date: '2026-02-19' },
      { date: '2026-02-18' },
    ]);

    const streak = await getDailyStreak();
    expect(streak).toBe(3);
  });

  it('stops counting at first gap', async () => {
    sleepRepository.getAll.mockResolvedValue([
      { date: '2026-02-20' },
      // gap on 2026-02-19
      { date: '2026-02-18' },
    ]);

    const streak = await getDailyStreak();
    expect(streak).toBe(1);
  });

  it('counts activity from any source (sleep, exercise, nutrition)', async () => {
    sleepRepository.getAll.mockResolvedValue([{ date: '2026-02-20' }]);
    exerciseRepository.getAll.mockResolvedValue([{ date: '2026-02-19' }]);
    nutritionRepository.getAllMeals.mockResolvedValue([{ date: '2026-02-18' }]);

    const streak = await getDailyStreak();
    expect(streak).toBe(3);
  });

  it('fetches all data once (not per-day)', async () => {
    sleepRepository.getAll.mockResolvedValue([
      { date: '2026-02-20' },
      { date: '2026-02-19' },
      { date: '2026-02-18' },
    ]);

    await getDailyStreak();

    expect(sleepRepository.getAll).toHaveBeenCalledTimes(1);
    expect(exerciseRepository.getAll).toHaveBeenCalledTimes(1);
    expect(nutritionRepository.getAllMeals).toHaveBeenCalledTimes(1);
  });
});
