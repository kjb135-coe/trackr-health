import { populateDemoData } from '@/src/utils/demoData';

const mockHabitCreate = jest.fn().mockResolvedValue({ id: 'h1' });
const mockSetCompletion = jest.fn().mockResolvedValue(undefined);
const mockSleepCreate = jest.fn().mockResolvedValue({ id: 's1' });
const mockExerciseCreate = jest.fn().mockResolvedValue({ id: 'e1' });
const mockCreateMeal = jest.fn().mockResolvedValue({ id: 'm1' });
const mockJournalCreate = jest.fn().mockResolvedValue({ id: 'j1' });

jest.mock('@/src/database/repositories', () => ({
  habitRepository: {
    create: (...args: unknown[]) => mockHabitCreate(...args),
    setCompletion: (...args: unknown[]) => mockSetCompletion(...args),
  },
  sleepRepository: {
    create: (...args: unknown[]) => mockSleepCreate(...args),
  },
  exerciseRepository: {
    create: (...args: unknown[]) => mockExerciseCreate(...args),
  },
  nutritionRepository: {
    createMeal: (...args: unknown[]) => mockCreateMeal(...args),
  },
  journalRepository: {
    create: (...args: unknown[]) => mockJournalCreate(...args),
  },
}));

describe('populateDemoData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates 5 demo habits', async () => {
    await populateDemoData();
    expect(mockHabitCreate).toHaveBeenCalledTimes(5);
    expect(mockHabitCreate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Morning Meditation', frequency: 'daily' }),
    );
    expect(mockHabitCreate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Read 30 minutes', frequency: 'daily' }),
    );
  });

  it('creates habit completions for 7 days per habit', async () => {
    await populateDemoData();
    // 5 habits × 7 days = 35 setCompletion calls
    expect(mockSetCompletion).toHaveBeenCalledTimes(35);
  });

  it('creates sleep entries for 7 days', async () => {
    await populateDemoData();
    expect(mockSleepCreate).toHaveBeenCalledTimes(7);
    // Verify first call has expected structure
    expect(mockSleepCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        bedtime: expect.any(String),
        wakeTime: expect.any(String),
        durationMinutes: expect.any(Number),
        quality: expect.any(Number),
      }),
    );
  });

  it('creates exercise sessions (randomized but up to 7)', async () => {
    await populateDemoData();
    // Exercise has 60% chance per day, so between 0-7 calls
    expect(mockExerciseCreate.mock.calls.length).toBeLessThanOrEqual(7);
  });

  it('creates 2 meals (breakfast and lunch)', async () => {
    await populateDemoData();
    expect(mockCreateMeal).toHaveBeenCalledTimes(2);
    // Verify breakfast
    expect(mockCreateMeal).toHaveBeenCalledWith(
      expect.objectContaining({
        mealType: 'breakfast',
        name: 'Oatmeal with berries',
        totalCalories: 350,
      }),
      expect.arrayContaining([
        expect.objectContaining({ name: 'Oatmeal' }),
        expect.objectContaining({ name: 'Blueberries' }),
      ]),
    );
    // Verify lunch
    expect(mockCreateMeal).toHaveBeenCalledWith(
      expect.objectContaining({
        mealType: 'lunch',
        name: 'Grilled chicken salad',
        totalCalories: 520,
      }),
      expect.arrayContaining([expect.objectContaining({ name: 'Grilled chicken breast' })]),
    );
  });

  it('creates 3 journal entries', async () => {
    await populateDemoData();
    expect(mockJournalCreate).toHaveBeenCalledTimes(3);
    expect(mockJournalCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Productive Monday',
        isScanned: false,
        tags: ['fitness', 'productivity', 'social'],
      }),
    );
    expect(mockJournalCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'New beginnings',
        isScanned: false,
      }),
    );
  });
});
