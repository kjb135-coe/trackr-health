import { habitRepository, sleepRepository, exerciseRepository, nutritionRepository } from '@/src/database/repositories';
import { getDateString } from '@/src/utils/date';
import { subDays, startOfWeek, endOfWeek, format } from 'date-fns';

export interface WeeklyStats {
  habitsCompleted: number;
  habitsTotal: number;
  habitCompletionRate: number;
  avgSleepHours: number;
  avgSleepQuality: number;
  totalExerciseMinutes: number;
  avgDailyCalories: number;
  daysTracked: number;
}

export interface TrendData {
  thisWeek: WeeklyStats;
  lastWeek: WeeklyStats;
  sleepTrend: 'up' | 'down' | 'stable';
  exerciseTrend: 'up' | 'down' | 'stable';
  habitTrend: 'up' | 'down' | 'stable';
}

function getTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
  const threshold = 0.1; // 10% change threshold
  if (previous === 0) return current > 0 ? 'up' : 'stable';
  const change = (current - previous) / previous;
  if (change > threshold) return 'up';
  if (change < -threshold) return 'down';
  return 'stable';
}

export async function getWeeklyStats(weekStartDate: Date): Promise<WeeklyStats> {
  const weekStart = startOfWeek(weekStartDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(weekStartDate, { weekStartsOn: 1 });

  const startStr = format(weekStart, 'yyyy-MM-dd');
  const endStr = format(weekEnd, 'yyyy-MM-dd');

  // Get all habits and their completions for the week
  const habits = await habitRepository.getAll();
  let habitsCompleted = 0;
  let habitsTotal = 0;

  for (const habit of habits) {
    const completions = await habitRepository.getCompletionsForHabit(
      habit.id,
      startStr,
      endStr
    );
    const completed = completions.filter((c) => c.completed).length;
    habitsCompleted += completed;
    habitsTotal += 7; // Assuming daily habits
  }

  // Sleep stats
  const sleepEntries = await sleepRepository.getAll();
  const weekSleep = sleepEntries.filter(
    (s) => s.date >= startStr && s.date <= endStr
  );
  const avgSleepHours =
    weekSleep.length > 0
      ? weekSleep.reduce((sum, s) => sum + s.durationMinutes / 60, 0) /
        weekSleep.length
      : 0;
  const avgSleepQuality =
    weekSleep.length > 0
      ? weekSleep.reduce((sum, s) => sum + s.quality, 0) / weekSleep.length
      : 0;

  // Exercise stats
  const exerciseEntries = await exerciseRepository.getAll();
  const weekExercise = exerciseEntries.filter(
    (e) => e.date >= startStr && e.date <= endStr
  );
  const totalExerciseMinutes = weekExercise.reduce(
    (sum, e) => sum + e.durationMinutes,
    0
  );

  // Nutrition stats
  const meals = await nutritionRepository.getAllMeals();
  const weekMeals = meals.filter(
    (m) => m.date >= startStr && m.date <= endStr
  );
  const totalCalories = weekMeals.reduce((sum, m) => sum + m.totalCalories, 0);
  const uniqueDays = new Set(weekMeals.map((m) => m.date)).size;
  const avgDailyCalories = uniqueDays > 0 ? totalCalories / uniqueDays : 0;

  // Days tracked (any activity)
  const allDates = new Set([
    ...weekSleep.map((s) => s.date),
    ...weekExercise.map((e) => e.date),
    ...weekMeals.map((m) => m.date),
  ]);

  return {
    habitsCompleted,
    habitsTotal,
    habitCompletionRate: habitsTotal > 0 ? habitsCompleted / habitsTotal : 0,
    avgSleepHours,
    avgSleepQuality,
    totalExerciseMinutes,
    avgDailyCalories,
    daysTracked: allDates.size,
  };
}

export async function getTrendData(): Promise<TrendData> {
  const today = new Date();
  const lastWeekStart = subDays(today, 7);

  const thisWeek = await getWeeklyStats(today);
  const lastWeek = await getWeeklyStats(lastWeekStart);

  return {
    thisWeek,
    lastWeek,
    sleepTrend: getTrend(thisWeek.avgSleepHours, lastWeek.avgSleepHours),
    exerciseTrend: getTrend(
      thisWeek.totalExerciseMinutes,
      lastWeek.totalExerciseMinutes
    ),
    habitTrend: getTrend(
      thisWeek.habitCompletionRate,
      lastWeek.habitCompletionRate
    ),
  };
}

export async function getDailyStreak(): Promise<number> {
  let streak = 0;
  let currentDate = new Date();

  while (true) {
    const dateStr = getDateString(currentDate);

    // Check if any activity was logged on this day
    const sleepEntries = await sleepRepository.getAll();
    const exerciseEntries = await exerciseRepository.getAll();
    const meals = await nutritionRepository.getAllMeals();

    const hasActivity =
      sleepEntries.some((s) => s.date === dateStr) ||
      exerciseEntries.some((e) => e.date === dateStr) ||
      meals.some((m) => m.date === dateStr);

    if (hasActivity) {
      streak++;
      currentDate = subDays(currentDate, 1);
    } else {
      break;
    }
  }

  return streak;
}
