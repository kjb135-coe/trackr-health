import {
  habitRepository,
  sleepRepository,
  exerciseRepository,
  nutritionRepository,
  journalRepository,
} from '@/src/database/repositories';
import { getDateString } from './date';
import { HABIT_COLORS } from './constants';
import { subDays, format } from 'date-fns';

export async function populateDemoData(): Promise<void> {
  // Create habits
  const habits = [
    { name: 'Morning Meditation', color: HABIT_COLORS[1], frequency: 'daily' as const },
    { name: 'Exercise', color: HABIT_COLORS[2], frequency: 'daily' as const },
    { name: 'Read 30 minutes', color: HABIT_COLORS[4], frequency: 'daily' as const },
    { name: 'Drink 8 glasses of water', color: HABIT_COLORS[7], frequency: 'daily' as const },
    { name: 'No social media before noon', color: HABIT_COLORS[0], frequency: 'daily' as const },
  ];

  const createdHabits = [];
  for (const habit of habits) {
    const created = await habitRepository.create(habit);
    createdHabits.push(created);
  }

  // Add completions for the past 7 days
  for (const habit of createdHabits) {
    for (let i = 6; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      // Random completion (70% chance of completing)
      const completed = Math.random() > 0.3;
      await habitRepository.setCompletion(habit.id, date, completed);
    }
  }

  // Create sleep entries for the past 7 days
  for (let i = 6; i >= 0; i--) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
    const bedtimeHour = 22 + Math.floor(Math.random() * 2); // 10pm-11pm
    const bedtimeMin = Math.floor(Math.random() * 60);
    const wakeHour = 6 + Math.floor(Math.random() * 2); // 6am-7am
    const wakeMin = Math.floor(Math.random() * 60);

    const bedtime = new Date();
    bedtime.setDate(bedtime.getDate() - i - 1);
    bedtime.setHours(bedtimeHour, bedtimeMin, 0, 0);

    const wakeTime = new Date();
    wakeTime.setDate(wakeTime.getDate() - i);
    wakeTime.setHours(wakeHour, wakeMin, 0, 0);

    const durationMinutes = Math.round((wakeTime.getTime() - bedtime.getTime()) / 60000);

    await sleepRepository.create({
      date,
      bedtime: bedtime.toISOString(),
      wakeTime: wakeTime.toISOString(),
      durationMinutes,
      quality: (Math.floor(Math.random() * 3) + 3) as 1 | 2 | 3 | 4 | 5, // 3-5
    });
  }

  // Create exercise sessions
  const exerciseTypes = ['running', 'weight_training', 'yoga', 'cycling', 'swimming'] as const;
  const intensities = ['moderate', 'high'] as const;

  for (let i = 6; i >= 0; i--) {
    // 60% chance of exercising each day
    if (Math.random() > 0.4) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const type = exerciseTypes[Math.floor(Math.random() * exerciseTypes.length)];
      const intensity = intensities[Math.floor(Math.random() * intensities.length)];
      const durationMinutes = 30 + Math.floor(Math.random() * 60); // 30-90 min
      const caloriesBurned = Math.round(durationMinutes * (intensity === 'high' ? 10 : 7));

      await exerciseRepository.create({
        date,
        type,
        durationMinutes,
        intensity,
        caloriesBurned,
      });
    }
  }

  // Create meals for today
  const today = getDateString();

  // Breakfast
  await nutritionRepository.createMeal(
    {
      date: today,
      mealType: 'breakfast',
      name: 'Oatmeal with berries',
      totalCalories: 350,
      totalProtein: 12,
      totalCarbs: 55,
      totalFat: 8,
    },
    [
      {
        name: 'Oatmeal',
        quantity: 1,
        unit: 'cup',
        calories: 150,
        protein: 5,
        carbs: 27,
        fat: 3,
        isAIGenerated: false,
      },
      {
        name: 'Blueberries',
        quantity: 0.5,
        unit: 'cup',
        calories: 40,
        protein: 0,
        carbs: 10,
        fat: 0,
        isAIGenerated: false,
      },
      {
        name: 'Banana',
        quantity: 1,
        unit: 'medium',
        calories: 105,
        protein: 1,
        carbs: 27,
        fat: 0,
        isAIGenerated: false,
      },
      {
        name: 'Almond milk',
        quantity: 1,
        unit: 'cup',
        calories: 30,
        protein: 1,
        carbs: 1,
        fat: 2.5,
        isAIGenerated: false,
      },
      {
        name: 'Honey',
        quantity: 1,
        unit: 'tbsp',
        calories: 25,
        protein: 0,
        carbs: 6,
        fat: 0,
        isAIGenerated: false,
      },
    ],
  );

  // Lunch
  await nutritionRepository.createMeal(
    {
      date: today,
      mealType: 'lunch',
      name: 'Grilled chicken salad',
      totalCalories: 520,
      totalProtein: 42,
      totalCarbs: 25,
      totalFat: 28,
    },
    [
      {
        name: 'Grilled chicken breast',
        quantity: 6,
        unit: 'oz',
        calories: 280,
        protein: 35,
        carbs: 0,
        fat: 6,
        isAIGenerated: false,
      },
      {
        name: 'Mixed greens',
        quantity: 2,
        unit: 'cups',
        calories: 20,
        protein: 2,
        carbs: 4,
        fat: 0,
        isAIGenerated: false,
      },
      {
        name: 'Cherry tomatoes',
        quantity: 0.5,
        unit: 'cup',
        calories: 15,
        protein: 1,
        carbs: 3,
        fat: 0,
        isAIGenerated: false,
      },
      {
        name: 'Avocado',
        quantity: 0.5,
        unit: 'medium',
        calories: 120,
        protein: 1,
        carbs: 6,
        fat: 10,
        isAIGenerated: false,
      },
      {
        name: 'Olive oil dressing',
        quantity: 2,
        unit: 'tbsp',
        calories: 85,
        protein: 0,
        carbs: 0,
        fat: 9,
        isAIGenerated: false,
      },
    ],
  );

  // Create journal entries
  const journalEntries = [
    {
      date: format(subDays(new Date(), 2), 'yyyy-MM-dd'),
      title: 'Productive Monday',
      content:
        'Had a great start to the week. Finished my morning workout early and felt energized all day. Made progress on the project at work and had a nice dinner with friends.',
      mood: 5 as const,
      tags: ['fitness', 'productivity', 'social'],
    },
    {
      date: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
      title: 'Reflection',
      content:
        "Took some time today to think about my goals for the month. I want to be more consistent with my habits and spend less time on my phone. Starting tomorrow, I'll track my screen time.",
      mood: 4 as const,
      tags: ['goals', 'mindfulness'],
    },
    {
      date: today,
      title: 'New beginnings',
      content:
        'Downloaded this new health tracking app today. Excited to see how it helps me stay on track with my fitness and wellness goals. The AI features look really cool!',
      mood: 4 as const,
      tags: ['health', 'goals'],
    },
  ];

  for (const entry of journalEntries) {
    await journalRepository.create({
      ...entry,
      isScanned: false,
    });
  }
}
