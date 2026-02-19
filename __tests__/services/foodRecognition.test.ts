import { analyzeFoodImage } from '@/src/services/claude/foodRecognition';

const mockCreate = jest.fn();

jest.mock('@/src/services/claude/client', () => ({
  getClaudeClient: jest.fn().mockResolvedValue({
    messages: { create: (...args: unknown[]) => mockCreate(...args) },
  }),
}));

jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn().mockResolvedValue('base64data'),
}));

const validResponse = {
  content: [
    {
      type: 'text',
      text: JSON.stringify({
        foods: [
          {
            name: 'Apple',
            portion: '1 medium',
            calories: 95,
            protein: 0.5,
            carbs: 25,
            fat: 0.3,
            confidence: 0.9,
          },
        ],
        totalCalories: 95,
        notes: 'Fresh apple',
      }),
    },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('analyzeFoodImage', () => {
  it('returns detected foods on success', async () => {
    mockCreate.mockResolvedValue(validResponse);

    const resultPromise = analyzeFoodImage('test.jpg');
    jest.runAllTimers();
    const result = await resultPromise;

    expect(result.detectedFoods).toHaveLength(1);
    expect(result.detectedFoods[0].name).toBe('Apple');
    expect(result.detectedFoods[0].calorieEstimate).toBe(95);
    expect(result.modelUsed).toBe('claude-sonnet-4-20250514');
  });

  it('throws timeout error when API is slow', async () => {
    mockCreate.mockReturnValue(
      new Promise(() => {
        // Never resolves — simulates a hung API call
      }),
    );

    const resultPromise = analyzeFoodImage('test.jpg');

    // Flush microtasks to let getClaudeClient and readAsStringAsync resolve
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    jest.advanceTimersByTime(30000);

    await expect(resultPromise).rejects.toThrow('Food analysis timed out. Please try again.');
  });

  it('throws on non-text response', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'image', source: {} }],
    });

    const resultPromise = analyzeFoodImage('test.jpg');
    jest.runAllTimers();

    await expect(resultPromise).rejects.toThrow('No text response from Claude');
  });

  it('throws on invalid JSON response', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'not json at all' }],
    });

    const resultPromise = analyzeFoodImage('test.jpg');
    jest.runAllTimers();

    await expect(resultPromise).rejects.toThrow('Could not find JSON in response');
  });

  it('throws on schema validation failure', async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify({ invalid: 'schema' }),
        },
      ],
    });

    const resultPromise = analyzeFoodImage('test.jpg');
    jest.runAllTimers();

    await expect(resultPromise).rejects.toThrow();
  });

  it('maps macros correctly when present', async () => {
    mockCreate.mockResolvedValue(validResponse);

    const resultPromise = analyzeFoodImage('test.jpg');
    jest.runAllTimers();
    const result = await resultPromise;

    expect(result.detectedFoods[0].macroEstimates).toEqual({
      protein: 0.5,
      carbs: 25,
      fat: 0.3,
    });
  });
});
