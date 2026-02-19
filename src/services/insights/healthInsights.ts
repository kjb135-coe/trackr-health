import {
  habitRepository,
  sleepRepository,
  exerciseRepository,
  nutritionRepository,
} from '@/src/database/repositories';
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

  // Batch-fetch all data for the date range (no N+1 loops)
  const [habits, completions, weekSleep, weekExercise, weekMeals] = await Promise.all([
    habitRepository.getAll(),
    habitRepository.getCompletionsForDateRange(startStr, endStr),
    sleepRepository.getByDateRange(startStr, endStr),
    exerciseRepository.getByDateRange(startStr, endStr),
    nutritionRepository.getMealsByDateRange(startStr, endStr),
  ]);

  const habitsCompleted = completions.filter((c) => c.completed).length;
  const habitsTotal = habits.length * 7; // Assuming daily habits

  const avgSleepHours =
    weekSleep.length > 0
      ? weekSleep.reduce((sum, s) => sum + s.durationMinutes / 60, 0) / weekSleep.length
      : 0;
  const avgSleepQuality =
    weekSleep.length > 0 ? weekSleep.reduce((sum, s) => sum + s.quality, 0) / weekSleep.length : 0;

  const totalExerciseMinutes = weekExercise.reduce((sum, e) => sum + e.durationMinutes, 0);

  const totalCalories = weekMeals.reduce((sum, m) => sum + m.totalCalories, 0);
  const uniqueDays = new Set(weekMeals.map((m) => m.date)).size;
  const avgDailyCalories = uniqueDays > 0 ? totalCalories / uniqueDays : 0;

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
    exerciseTrend: getTrend(thisWeek.totalExerciseMinutes, lastWeek.totalExerciseMinutes),
    habitTrend: getTrend(thisWeek.habitCompletionRate, lastWeek.habitCompletionRate),
  };
}

export async function getDailyStreak(): Promise<number> {
  // Fetch last 90 days of data (bounded query instead of full table scan)
  const today = new Date();
  const ninetyDaysAgo = subDays(today, 90);
  const todayStr = format(today, 'yyyy-MM-dd');
  const startStr = format(ninetyDaysAgo, 'yyyy-MM-dd');

  const [sleepEntries, exerciseEntries, meals] = await Promise.all([
    sleepRepository.getByDateRange(startStr, todayStr),
    exerciseRepository.getByDateRange(startStr, todayStr),
    nutritionRepository.getMealsByDateRange(startStr, todayStr),
  ]);

  const activeDates = new Set([
    ...sleepEntries.map((s) => s.date),
    ...exerciseEntries.map((e) => e.date),
    ...meals.map((m) => m.date),
  ]);

  let streak = 0;
  let currentDate = new Date();

  while (activeDates.has(getDateString(currentDate))) {
    streak++;
    currentDate = subDays(currentDate, 1);
  }

  return streak;
}
