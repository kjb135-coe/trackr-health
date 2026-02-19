import {
  generateDailyCoaching,
  generateHabitSuggestions,
  analyzeSleepPatterns,
  getExerciseRecommendation,
  analyzeJournalMood,
  getNutritionAdvice,
} from '@/src/services/ai/healthInsightsAI';

const mockCreate = jest.fn();

jest.mock('@/src/services/claude/client', () => ({
  getClaudeClient: jest.fn().mockResolvedValue({
    messages: { create: (...args: unknown[]) => mockCreate(...args) },
  }),
}));

const mockHabits = [
  { id: 'h1', name: 'Exercise', frequency: 'daily', createdAt: '2026-02-18T00:00:00Z' },
];

jest.mock('@/src/database/repositories', () => ({
  habitRepository: {
    getAll: jest.fn(() => Promise.resolve(mockHabits)),
    getCompletionsForDateRange: jest.fn(() =>
      Promise.resolve([
        { habitId: 'h1', date: '2026-02-18', completed: true },
        { habitId: 'h1', date: '2026-02-17', completed: false },
      ]),
    ),
  },
  sleepRepository: {
    getByDateRange: jest.fn(() =>
      Promise.resolve([
        {
          id: 's1',
          date: '2026-02-18',
          bedtime: '22:00',
          wakeTime: '06:00',
          durationMinutes: 480,
          quality: 4,
        },
        {
          id: 's2',
          date: '2026-02-17',
          bedtime: '23:00',
          wakeTime: '07:00',
          durationMinutes: 480,
          quality: 3,
        },
        {
          id: 's3',
          date: '2026-02-16',
          bedtime: '22:30',
          wakeTime: '06:30',
          durationMinutes: 480,
          quality: 4,
        },
      ]),
    ),
  },
  exerciseRepository: {
    getByDateRange: jest.fn(() =>
      Promise.resolve([
        {
          id: 'e1',
          date: '2026-02-18',
          type: 'running',
          durationMinutes: 30,
          intensity: 'moderate',
          caloriesBurned: 300,
        },
      ]),
    ),
  },
  nutritionRepository: {
    getMealsByDateRange: jest.fn(() =>
      Promise.resolve([
        {
          id: 'm1',
          date: '2026-02-18',
          mealType: 'lunch',
          name: 'Salad',
          totalCalories: 400,
          totalProtein: 20,
          totalCarbs: 30,
          totalFat: 15,
        },
        {
          id: 'm2',
          date: '2026-02-17',
          mealType: 'dinner',
          name: 'Pasta',
          totalCalories: 600,
          totalProtein: 25,
          totalCarbs: 80,
          totalFat: 20,
        },
        {
          id: 'm3',
          date: '2026-02-16',
          mealType: 'breakfast',
          name: 'Oatmeal',
          totalCalories: 350,
          totalProtein: 10,
          totalCarbs: 50,
          totalFat: 8,
        },
      ]),
    ),
  },
  journalRepository: {
    getByDateRange: jest.fn(() =>
      Promise.resolve([
        { id: 'j1', date: '2026-02-18', title: 'Good day', mood: 4, tags: ['work'] },
        { id: 'j2', date: '2026-02-17', title: 'Okay day', mood: 3, tags: ['home'] },
      ]),
    ),
  },
}));

function makeTextResponse(text: string) {
  return { content: [{ type: 'text', text }] };
}

function makeNonTextResponse() {
  return { content: [{ type: 'image', source: {} }] };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('healthInsightsAI', () => {
  describe('generateDailyCoaching', () => {
    it('returns parsed coaching data on success', async () => {
      const coaching = {
        greeting: 'Good morning!',
        insights: [
          {
            category: 'habits',
            title: 'Nice streak',
            insight: 'You completed Exercise today.',
            suggestion: 'Keep it up!',
            priority: 'medium',
          },
        ],
        dailyTip: 'Stay hydrated',
        motivationalMessage: 'Great progress!',
      };
      mockCreate.mockResolvedValue(makeTextResponse(JSON.stringify(coaching)));

      const resultPromise = generateDailyCoaching();
      jest.runAllTimers();
      const result = await resultPromise;

      expect(result.greeting).toBe('Good morning!');
      expect(result.insights).toHaveLength(1);
      expect(result.dailyTip).toBe('Stay hydrated');
    });

    it('returns default coaching on JSON parse failure', async () => {
      mockCreate.mockResolvedValue(makeTextResponse('not valid json'));

      const resultPromise = generateDailyCoaching();
      jest.runAllTimers();
      const result = await resultPromise;

      expect(result.greeting).toContain('Good morning');
      expect(result.insights).toHaveLength(1);
      expect(result.insights[0].category).toBe('overall');
    });

    it('throws on non-text response', async () => {
      mockCreate.mockResolvedValue(makeNonTextResponse());

      const resultPromise = generateDailyCoaching();
      jest.runAllTimers();

      await expect(resultPromise).rejects.toThrow('Unexpected response type');
    });
  });

  describe('generateHabitSuggestions', () => {
    it('returns parsed suggestions on success', async () => {
      const suggestions = [
        { name: 'Meditate', description: '10 min', frequency: 'daily', reason: 'Stress relief' },
      ];
      mockCreate.mockResolvedValue(makeTextResponse(JSON.stringify(suggestions)));

      const resultPromise = generateHabitSuggestions();
      jest.runAllTimers();
      const result = await resultPromise;

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Meditate');
    });

    it('returns default suggestion on parse failure', async () => {
      mockCreate.mockResolvedValue(makeTextResponse('invalid'));

      const resultPromise = generateHabitSuggestions();
      jest.runAllTimers();
      const result = await resultPromise;

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Morning Stretch');
    });

    it('throws on non-text response', async () => {
      mockCreate.mockResolvedValue(makeNonTextResponse());

      const resultPromise = generateHabitSuggestions();
      jest.runAllTimers();

      await expect(resultPromise).rejects.toThrow('Unexpected response type');
    });
  });

  describe('analyzeSleepPatterns', () => {
    it('returns early when insufficient sleep data', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { sleepRepository } = require('@/src/database/repositories');
      sleepRepository.getByDateRange.mockResolvedValueOnce([
        { id: 's1', date: '2026-02-18', durationMinutes: 480, quality: 4 },
      ]);

      const result = await analyzeSleepPatterns();

      expect(result.pattern).toBe('Not enough data');
      expect(result.recommendations[0]).toContain('Log at least 3 nights');
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('returns parsed analysis when sufficient data', async () => {
      const analysis = {
        pattern: 'Consistent bedtime around 10pm',
        qualityTrend: 'improving',
        recommendations: ['Keep consistent schedule'],
        optimalBedtime: '10:00 PM',
      };
      mockCreate.mockResolvedValue(makeTextResponse(JSON.stringify(analysis)));

      const resultPromise = analyzeSleepPatterns();
      jest.runAllTimers();
      const result = await resultPromise;

      expect(result.pattern).toBe('Consistent bedtime around 10pm');
      expect(result.qualityTrend).toBe('improving');
    });

    it('returns default analysis on parse failure', async () => {
      mockCreate.mockResolvedValue(makeTextResponse('bad json'));

      const resultPromise = analyzeSleepPatterns();
      jest.runAllTimers();
      const result = await resultPromise;

      expect(result.pattern).toBe('Variable sleep schedule');
      expect(result.qualityTrend).toBe('stable');
    });

    it('throws on non-text response', async () => {
      mockCreate.mockResolvedValue(makeNonTextResponse());

      const resultPromise = analyzeSleepPatterns();
      jest.runAllTimers();

      await expect(resultPromise).rejects.toThrow('Unexpected response type');
    });
  });

  describe('getExerciseRecommendation', () => {
    it('returns parsed recommendation on success', async () => {
      const rec = {
        type: 'Yoga',
        duration: 45,
        intensity: 'low',
        reason: 'Recovery day',
        targetCalories: 150,
      };
      mockCreate.mockResolvedValue(makeTextResponse(JSON.stringify(rec)));

      const resultPromise = getExerciseRecommendation();
      jest.runAllTimers();
      const result = await resultPromise;

      expect(result.type).toBe('Yoga');
      expect(result.duration).toBe(45);
    });

    it('returns default recommendation on parse failure', async () => {
      mockCreate.mockResolvedValue(makeTextResponse('nope'));

      const resultPromise = getExerciseRecommendation();
      jest.runAllTimers();
      const result = await resultPromise;

      expect(result.type).toBe('Walking');
      expect(result.intensity).toBe('low');
    });

    it('throws on non-text response', async () => {
      mockCreate.mockResolvedValue(makeNonTextResponse());

      const resultPromise = getExerciseRecommendation();
      jest.runAllTimers();

      await expect(resultPromise).rejects.toThrow('Unexpected response type');
    });
  });

  describe('analyzeJournalMood', () => {
    it('returns early when insufficient journal data', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { journalRepository } = require('@/src/database/repositories');
      journalRepository.getByDateRange.mockResolvedValueOnce([
        { id: 'j1', date: '2026-02-18', title: 'Only one', mood: 4 },
      ]);

      const result = await analyzeJournalMood();

      expect(result.overallMood).toBe('Not enough data');
      expect(result.suggestions[0]).toContain('Write a few journal entries');
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('returns parsed mood analysis when sufficient data', async () => {
      const mood = {
        overallMood: 'Generally positive',
        commonThemes: ['work', 'productivity'],
        moodTrend: 'improving',
        suggestions: ['Keep journaling'],
      };
      mockCreate.mockResolvedValue(makeTextResponse(JSON.stringify(mood)));

      const resultPromise = analyzeJournalMood();
      jest.runAllTimers();
      const result = await resultPromise;

      expect(result.overallMood).toBe('Generally positive');
      expect(result.moodTrend).toBe('improving');
    });

    it('returns default mood analysis on parse failure', async () => {
      mockCreate.mockResolvedValue(makeTextResponse('invalid'));

      const resultPromise = analyzeJournalMood();
      jest.runAllTimers();
      const result = await resultPromise;

      expect(result.overallMood).toBe('Varied emotions throughout the week');
      expect(result.moodTrend).toBe('stable');
    });

    it('throws on non-text response', async () => {
      mockCreate.mockResolvedValue(makeNonTextResponse());

      const resultPromise = analyzeJournalMood();
      jest.runAllTimers();

      await expect(resultPromise).rejects.toThrow('Unexpected response type');
    });
  });

  describe('getNutritionAdvice', () => {
    it('returns early when insufficient meal data', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { nutritionRepository } = require('@/src/database/repositories');
      nutritionRepository.getMealsByDateRange.mockResolvedValueOnce([
        { id: 'm1', date: '2026-02-18', totalCalories: 400 },
      ]);

      const result = await getNutritionAdvice();

      expect(result.advice).toContain('Log more meals');
      expect(result.suggestions[0]).toContain('log at least 3 meals');
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('returns parsed nutrition advice when sufficient data', async () => {
      const advice = {
        advice: 'Increase protein intake',
        suggestions: ['Add eggs to breakfast', 'Snack on nuts', 'More lean meats'],
      };
      mockCreate.mockResolvedValue(makeTextResponse(JSON.stringify(advice)));

      const resultPromise = getNutritionAdvice();
      jest.runAllTimers();
      const result = await resultPromise;

      expect(result.advice).toBe('Increase protein intake');
      expect(result.suggestions).toHaveLength(3);
    });

    it('returns default advice on parse failure', async () => {
      mockCreate.mockResolvedValue(makeTextResponse('not json'));

      const resultPromise = getNutritionAdvice();
      jest.runAllTimers();
      const result = await resultPromise;

      expect(result.advice).toContain('balanced meals');
      expect(result.suggestions).toHaveLength(2);
    });

    it('throws on non-text response', async () => {
      mockCreate.mockResolvedValue(makeNonTextResponse());

      const resultPromise = getNutritionAdvice();
      jest.runAllTimers();

      await expect(resultPromise).rejects.toThrow('Unexpected response type');
    });
  });
});
