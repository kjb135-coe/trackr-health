import { getClaudeClient } from '../claude/client';
import {
  habitRepository,
  sleepRepository,
  exerciseRepository,
  nutritionRepository,
  journalRepository,
} from '@/src/database/repositories';
import { AI_MODEL, withTimeout } from '@/src/utils/constants';

export interface AIInsight {
  category: 'habits' | 'sleep' | 'exercise' | 'nutrition' | 'journal' | 'overall';
  title: string;
  insight: string;
  suggestion: string;
  priority: 'low' | 'medium' | 'high';
}

export interface DailyAICoaching {
  greeting: string;
  insights: AIInsight[];
  dailyTip: string;
  motivationalMessage: string;
}

export interface HabitSuggestion {
  name: string;
  description: string;
  frequency: 'daily' | 'weekly';
  reason: string;
}

export interface SleepAnalysis {
  pattern: string;
  qualityTrend: 'improving' | 'declining' | 'stable';
  recommendations: string[];
  optimalBedtime: string;
}

export interface ExerciseRecommendation {
  type: string;
  duration: number;
  intensity: 'low' | 'medium' | 'high';
  reason: string;
  targetCalories: number;
}

export interface MoodAnalysis {
  overallMood: string;
  commonThemes: string[];
  moodTrend: 'improving' | 'declining' | 'stable';
  suggestions: string[];
}

// Default fallback responses when AI JSON parsing fails
const DEFAULT_COACHING: DailyAICoaching = {
  greeting: "Good morning! Let's make today count.",
  insights: [
    {
      category: 'overall',
      title: 'Keep Tracking',
      insight: 'Continue logging your health data to get personalized insights.',
      suggestion: 'Try to log at least one activity today.',
      priority: 'medium',
    },
  ],
  dailyTip: 'Stay hydrated by keeping a water bottle nearby.',
  motivationalMessage: 'Every small step counts towards better health!',
};

const DEFAULT_HABIT_SUGGESTIONS: HabitSuggestion[] = [
  {
    name: 'Morning Stretch',
    description: '5-minute stretching routine after waking up',
    frequency: 'daily',
    reason: 'Helps improve flexibility and starts your day with movement',
  },
];

const DEFAULT_SLEEP_ANALYSIS: SleepAnalysis = {
  pattern: 'Variable sleep schedule',
  qualityTrend: 'stable',
  recommendations: ['Try to maintain consistent sleep and wake times'],
  optimalBedtime: '10:30 PM',
};

const DEFAULT_EXERCISE_RECOMMENDATION: ExerciseRecommendation = {
  type: 'Walking',
  duration: 30,
  intensity: 'low',
  reason: 'A gentle walk is always a great choice',
  targetCalories: 150,
};

const DEFAULT_MOOD_ANALYSIS: MoodAnalysis = {
  overallMood: 'Varied emotions throughout the week',
  commonThemes: [],
  moodTrend: 'stable',
  suggestions: ['Continue journaling to track your emotional patterns'],
};

const DEFAULT_NUTRITION_ADVICE = {
  advice: 'Focus on balanced meals with protein, carbs, and healthy fats.',
  suggestions: ['Include vegetables with each meal', 'Stay hydrated'],
};

// Gather recent data for AI analysis
async function gatherHealthData() {
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const todayStr = today.toISOString().split('T')[0];
  const weekAgoStr = weekAgo.toISOString().split('T')[0];

  const [habits, recentSleep, recentExercise, recentMeals, recentJournal] = await Promise.all([
    habitRepository.getAll(),
    sleepRepository.getByDateRange(weekAgoStr, todayStr),
    exerciseRepository.getByDateRange(weekAgoStr, todayStr),
    nutritionRepository.getMealsByDateRange(weekAgoStr, todayStr),
    journalRepository.getByDateRange(weekAgoStr, todayStr),
  ]);

  // Get all completions in a single batch query
  const allCompletions = await habitRepository.getCompletionsForDateRange(weekAgoStr, todayStr);
  const habitsWithCompletions = habits.map((habit) => ({
    ...habit,
    recentCompletions: allCompletions.filter((c) => c.habitId === habit.id),
  }));

  return {
    habits: habitsWithCompletions,
    sleep: recentSleep,
    exercise: recentExercise,
    meals: recentMeals,
    journal: recentJournal,
  };
}

export async function generateDailyCoaching(): Promise<DailyAICoaching> {
  const client = await getClaudeClient();
  const data = await gatherHealthData();

  const prompt = `You are a supportive health coach AI for the Trackr app. Analyze the user's health data from the past week and provide personalized coaching.

User's Health Data (Last 7 Days):

HABITS (${data.habits.length} habits):
${data.habits.map((h) => `- ${h.name}: ${h.recentCompletions?.filter((c) => c.completed).length || 0}/7 days completed`).join('\n')}

SLEEP (${data.sleep.length} entries):
${data.sleep.map((s) => `- ${s.date}: ${s.durationMinutes} min, quality ${s.quality}/5`).join('\n') || 'No sleep data'}

EXERCISE (${data.exercise.length} sessions):
${data.exercise.map((e) => `- ${e.date}: ${e.type}, ${e.durationMinutes} min, ${e.intensity} intensity`).join('\n') || 'No exercise data'}

NUTRITION (${data.meals.length} meals logged):
${
  data.meals
    .slice(0, 10)
    .map((m) => `- ${m.date} ${m.mealType}: ${m.totalCalories} cal`)
    .join('\n') || 'No nutrition data'
}

JOURNAL (${data.journal.length} entries):
${data.journal.map((j) => `- ${j.date}: mood ${j.mood || 'not set'}/5`).join('\n') || 'No journal entries'}

Respond with ONLY valid JSON in this exact format:
{
  "greeting": "A warm, personalized morning greeting (1 sentence)",
  "insights": [
    {
      "category": "habits|sleep|exercise|nutrition|journal|overall",
      "title": "Short insight title",
      "insight": "What you noticed from the data (1-2 sentences)",
      "suggestion": "Actionable suggestion (1 sentence)",
      "priority": "low|medium|high"
    }
  ],
  "dailyTip": "One practical health tip for today (1 sentence)",
  "motivationalMessage": "Encouraging message based on their progress (1-2 sentences)"
}

Generate 3-5 insights focusing on the most important patterns. Be supportive but honest. If data is limited, acknowledge it and encourage tracking.`;

  const response = await withTimeout(
    client.messages.create({
      model: AI_MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
    'Daily coaching request timed out. Please try again.',
  );

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    return JSON.parse(content.text) as DailyAICoaching;
  } catch {
    return DEFAULT_COACHING;
  }
}

export async function generateHabitSuggestions(): Promise<HabitSuggestion[]> {
  const client = await getClaudeClient();
  const data = await gatherHealthData();

  const prompt = `Based on this user's current habits and health patterns, suggest 3 new habits that would complement their routine.

Current Habits:
${data.habits.map((h) => `- ${h.name} (${h.frequency})`).join('\n') || 'No habits yet'}

Recent Exercise Types: ${[...new Set(data.exercise.map((e) => e.type))].join(', ') || 'None'}
Average Sleep Quality: ${data.sleep.length > 0 ? (data.sleep.reduce((acc, s) => acc + s.quality, 0) / data.sleep.length).toFixed(1) : 'Unknown'}
Recent Journal Moods: ${
    data.journal
      .filter((j) => j.mood)
      .map((j) => j.mood)
      .join(', ') || 'Not tracked'
  }

Respond with ONLY valid JSON array:
[
  {
    "name": "Habit name (short)",
    "description": "Brief description",
    "frequency": "daily|weekly",
    "reason": "Why this habit would help them"
  }
]

Suggest habits that fill gaps in their routine. Be specific and practical.`;

  const response = await withTimeout(
    client.messages.create({
      model: AI_MODEL,
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    }),
    'Habit suggestions request timed out. Please try again.',
  );

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    return JSON.parse(content.text) as HabitSuggestion[];
  } catch {
    return DEFAULT_HABIT_SUGGESTIONS;
  }
}

export async function analyzeSleepPatterns(): Promise<SleepAnalysis> {
  const client = await getClaudeClient();
  const data = await gatherHealthData();

  if (data.sleep.length < 3) {
    return {
      pattern: 'Not enough data',
      qualityTrend: 'stable',
      recommendations: ['Log at least 3 nights of sleep to get personalized analysis'],
      optimalBedtime: '10:30 PM',
    };
  }

  const prompt = `Analyze this user's sleep data and provide insights.

Sleep Log (Last 7 Days):
${data.sleep.map((s) => `- ${s.date}: Bed ${s.bedtime}, Wake ${s.wakeTime}, Duration ${s.durationMinutes}min, Quality ${s.quality}/5, Factors: ${s.factors?.join(', ') || 'none'}`).join('\n')}

Respond with ONLY valid JSON:
{
  "pattern": "Brief description of their sleep pattern (1 sentence)",
  "qualityTrend": "improving|declining|stable",
  "recommendations": ["Specific recommendation 1", "Specific recommendation 2", "Specific recommendation 3"],
  "optimalBedtime": "Suggested bedtime based on their data (e.g., 10:30 PM)"
}

Be specific and reference their actual data.`;

  const response = await withTimeout(
    client.messages.create({
      model: AI_MODEL,
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    }),
    'Sleep analysis request timed out. Please try again.',
  );

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    return JSON.parse(content.text) as SleepAnalysis;
  } catch {
    return DEFAULT_SLEEP_ANALYSIS;
  }
}

export async function getExerciseRecommendation(): Promise<ExerciseRecommendation> {
  const client = await getClaudeClient();
  const data = await gatherHealthData();

  const prompt = `Based on this user's recent exercise history, suggest their next workout.

Recent Workouts (Last 7 Days):
${data.exercise.map((e) => `- ${e.date}: ${e.type}, ${e.durationMinutes}min, ${e.intensity} intensity, ${e.caloriesBurned || 0} cal`).join('\n') || 'No recent workouts'}

Sleep Quality Average: ${data.sleep.length > 0 ? (data.sleep.reduce((acc, s) => acc + s.quality, 0) / data.sleep.length).toFixed(1) : 'Unknown'}

Respond with ONLY valid JSON:
{
  "type": "Specific exercise type (e.g., Running, HIIT, Yoga, Strength Training)",
  "duration": 30,
  "intensity": "low|medium|high",
  "reason": "Why this workout is recommended today (1 sentence)",
  "targetCalories": 200
}

Consider their recent activity level and suggest variety. If they're tired (low sleep quality), suggest lighter exercise.`;

  const response = await withTimeout(
    client.messages.create({
      model: AI_MODEL,
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    }),
    'Exercise recommendation request timed out. Please try again.',
  );

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    return JSON.parse(content.text) as ExerciseRecommendation;
  } catch {
    return DEFAULT_EXERCISE_RECOMMENDATION;
  }
}

export async function analyzeJournalMood(): Promise<MoodAnalysis> {
  const client = await getClaudeClient();
  const data = await gatherHealthData();

  if (data.journal.length < 2) {
    return {
      overallMood: 'Not enough data',
      commonThemes: [],
      moodTrend: 'stable',
      suggestions: ['Write a few journal entries to get mood analysis'],
    };
  }

  const prompt = `Analyze the mood patterns from these journal entries.

Recent Journal Entries:
${data.journal.map((j) => `- ${j.date}: Mood ${j.mood || 'not set'}/5, Title: "${j.title || 'Untitled'}", Tags: ${j.tags?.join(', ') || 'none'}`).join('\n')}

Respond with ONLY valid JSON:
{
  "overallMood": "Brief description of their emotional state (1 sentence)",
  "commonThemes": ["Theme 1", "Theme 2"],
  "moodTrend": "improving|declining|stable",
  "suggestions": ["Supportive suggestion 1", "Supportive suggestion 2"]
}

Be supportive and non-judgmental. Focus on patterns, not individual entries.`;

  const response = await withTimeout(
    client.messages.create({
      model: AI_MODEL,
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    }),
    'Mood analysis request timed out. Please try again.',
  );

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    return JSON.parse(content.text) as MoodAnalysis;
  } catch {
    return DEFAULT_MOOD_ANALYSIS;
  }
}

export async function getNutritionAdvice(): Promise<{ advice: string; suggestions: string[] }> {
  const client = await getClaudeClient();
  const data = await gatherHealthData();

  if (data.meals.length < 3) {
    return {
      advice: 'Log more meals to get personalized nutrition advice.',
      suggestions: ['Try to log at least 3 meals to see patterns'],
    };
  }

  const totalCalories = data.meals.reduce((acc, m) => acc + (m.totalCalories || 0), 0);
  const avgCalories = totalCalories / data.meals.length;

  const prompt = `Provide brief nutrition advice based on this meal log.

Recent Meals:
${data.meals
  .slice(0, 10)
  .map(
    (m) =>
      `- ${m.date} ${m.mealType}: ${m.name || 'Unnamed'}, ${m.totalCalories} cal, P:${m.totalProtein || 0}g C:${m.totalCarbs || 0}g F:${m.totalFat || 0}g`,
  )
  .join('\n')}

Average Calories per Meal: ${avgCalories.toFixed(0)}

Respond with ONLY valid JSON:
{
  "advice": "One sentence of personalized nutrition advice",
  "suggestions": ["Specific suggestion 1", "Specific suggestion 2", "Specific suggestion 3"]
}

Be practical and encouraging.`;

  const response = await withTimeout(
    client.messages.create({
      model: AI_MODEL,
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    }),
    'Nutrition advice request timed out. Please try again.',
  );

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    return JSON.parse(content.text);
  } catch {
    return DEFAULT_NUTRITION_ADVICE;
  }
}
