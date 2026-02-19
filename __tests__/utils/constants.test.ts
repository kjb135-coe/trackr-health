import {
  getQualityColor,
  estimateCalories,
  withTimeout,
  EXERCISE_TYPE_LABELS,
  INTENSITY_LABELS,
  MEAL_TYPE_LABELS,
  QUALITY_LABELS,
  MOOD_LABELS,
  SLEEP_FACTORS,
  HABIT_COLORS,
  AI_MODEL,
  AI_MAX_TOKENS,
  AI_MAX_TOKENS_MEDIUM,
  AI_MAX_TOKENS_BRIEF,
  AI_OCR_MAX_TOKENS,
  TAB_CONTENT_PADDING_BOTTOM,
  EMAIL_VERIFICATION_POLL_MS,
  STORAGE_KEYS,
  OCR_CONFIDENCE,
  APP_LINKS,
} from '@/src/utils/constants';

const mockColors = {
  error: '#FF0000',
  warning: '#FFA500',
  info: '#0088FF',
  success: '#00CC00',
  sleep: '#8B5CF6',
  textTertiary: '#999999',
};

describe('getQualityColor', () => {
  it('returns error color for quality 1', () => {
    expect(getQualityColor(1, mockColors as never)).toBe('#FF0000');
  });

  it('returns warning color for quality 2', () => {
    expect(getQualityColor(2, mockColors as never)).toBe('#FFA500');
  });

  it('returns info color for quality 3', () => {
    expect(getQualityColor(3, mockColors as never)).toBe('#0088FF');
  });

  it('returns success color for quality 4', () => {
    expect(getQualityColor(4, mockColors as never)).toBe('#00CC00');
  });

  it('returns sleep color for quality 5', () => {
    expect(getQualityColor(5, mockColors as never)).toBe('#8B5CF6');
  });

  it('returns textTertiary for out-of-range quality', () => {
    expect(getQualityColor(0, mockColors as never)).toBe('#999999');
    expect(getQualityColor(6, mockColors as never)).toBe('#999999');
  });
});

describe('estimateCalories', () => {
  it('calculates calories for running at medium intensity', () => {
    // running = 11 cal/min, 30 min, intensity 3: 11 * 30 * (0.6 + 3/5 * 0.8) = 11 * 30 * 1.08 = 356
    expect(estimateCalories('running', 30, 3)).toBe(356);
  });

  it('calculates calories for yoga at low intensity', () => {
    // yoga = 3 cal/min, 60 min, intensity 1: 3 * 60 * (0.6 + 1/5 * 0.8) = 3 * 60 * 0.76 = 137
    expect(estimateCalories('yoga', 60, 1)).toBe(137);
  });

  it('calculates calories for weight training at high intensity', () => {
    // weight_training = 5 cal/min, 45 min, intensity 5: 5 * 45 * (0.6 + 5/5 * 0.8) = 5 * 45 * 1.4 = 315
    expect(estimateCalories('weight_training', 45, 5)).toBe(315);
  });

  it('uses default base for unknown exercise type', () => {
    // unknown defaults to 6 cal/min, 30 min, intensity 3: 6 * 30 * 1.08 = 194
    expect(estimateCalories('unknown_type', 30, 3)).toBe(194);
  });

  it('returns 0 for 0 duration', () => {
    expect(estimateCalories('running', 0, 3)).toBe(0);
  });

  it('increases with intensity', () => {
    const lowIntensity = estimateCalories('running', 30, 1);
    const highIntensity = estimateCalories('running', 30, 5);
    expect(highIntensity).toBeGreaterThan(lowIntensity);
  });
});

describe('withTimeout', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('resolves when promise completes before timeout', async () => {
    const result = await withTimeout(Promise.resolve('ok'), 'timed out');
    expect(result).toBe('ok');
  });

  it('rejects with timeout message when promise is slow', async () => {
    const slow = new Promise<string>((resolve) => setTimeout(() => resolve('late'), 60000));
    const promise = withTimeout(slow, 'Request timed out');
    jest.advanceTimersByTime(30000);
    await expect(promise).rejects.toThrow('Request timed out');
  });

  it('propagates original error when promise rejects before timeout', async () => {
    const failing = Promise.reject(new Error('API error'));
    await expect(withTimeout(failing, 'timed out')).rejects.toThrow('API error');
  });
});

describe('EXERCISE_TYPE_LABELS', () => {
  it('has labels for all expected exercise types', () => {
    const expectedTypes = [
      'running',
      'walking',
      'cycling',
      'swimming',
      'weight_training',
      'yoga',
      'hiit',
      'sports',
      'cardio',
      'stretching',
      'other',
    ];
    for (const type of expectedTypes) {
      expect(EXERCISE_TYPE_LABELS[type]).toBeDefined();
      expect(typeof EXERCISE_TYPE_LABELS[type]).toBe('string');
    }
  });
});

describe('INTENSITY_LABELS', () => {
  it('has labels for all intensity levels', () => {
    expect(INTENSITY_LABELS).toEqual({
      low: 'Low',
      moderate: 'Moderate',
      high: 'High',
      very_high: 'Very High',
    });
  });
});

describe('MEAL_TYPE_LABELS', () => {
  it('has labels for all meal types', () => {
    expect(MEAL_TYPE_LABELS).toEqual({
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      dinner: 'Dinner',
      snack: 'Snack',
    });
  });
});

describe('QUALITY_LABELS', () => {
  it('has labels for qualities 1-5', () => {
    expect(Object.keys(QUALITY_LABELS)).toHaveLength(5);
    for (let i = 1; i <= 5; i++) {
      expect(QUALITY_LABELS[i]).toBeDefined();
    }
  });
});

describe('MOOD_LABELS', () => {
  it('has labels for moods 1-5', () => {
    expect(Object.keys(MOOD_LABELS)).toHaveLength(5);
    expect(MOOD_LABELS[1]).toBe('Terrible');
    expect(MOOD_LABELS[5]).toBe('Great');
  });
});

describe('SLEEP_FACTORS', () => {
  it('is a non-empty array of strings', () => {
    expect(Array.isArray(SLEEP_FACTORS)).toBe(true);
    expect(SLEEP_FACTORS.length).toBeGreaterThan(0);
    for (const factor of SLEEP_FACTORS) {
      expect(typeof factor).toBe('string');
    }
  });

  it('includes expected factors', () => {
    expect(SLEEP_FACTORS).toContain('caffeine');
    expect(SLEEP_FACTORS).toContain('stress');
    expect(SLEEP_FACTORS).toContain('exercise');
  });
});

describe('HABIT_COLORS', () => {
  it('is a non-empty array of valid hex colors', () => {
    expect(HABIT_COLORS.length).toBeGreaterThanOrEqual(8);
    for (const color of HABIT_COLORS) {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

describe('AI constants', () => {
  it('AI_MODEL is a non-empty string', () => {
    expect(typeof AI_MODEL).toBe('string');
    expect(AI_MODEL.length).toBeGreaterThan(0);
  });

  it('AI_MAX_TOKENS values are positive integers in ascending order', () => {
    expect(AI_MAX_TOKENS_BRIEF).toBeLessThan(AI_MAX_TOKENS_MEDIUM);
    expect(AI_MAX_TOKENS_MEDIUM).toBeLessThan(AI_MAX_TOKENS);
    expect(AI_OCR_MAX_TOKENS).toBeGreaterThan(AI_MAX_TOKENS);
  });
});

describe('STORAGE_KEYS', () => {
  it('has all required storage keys', () => {
    expect(STORAGE_KEYS.CLAUDE_API_KEY).toBeDefined();
    expect(STORAGE_KEYS.THEME_MODE).toBeDefined();
    expect(STORAGE_KEYS.GOALS).toBeDefined();
    expect(STORAGE_KEYS.AUTH_USER).toBeDefined();
    expect(STORAGE_KEYS.ONBOARDING_COMPLETE).toBeDefined();
  });

  it('all values are non-empty strings', () => {
    for (const value of Object.values(STORAGE_KEYS)) {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    }
  });
});

describe('OCR_CONFIDENCE', () => {
  it('has thresholds in valid range [0, 1]', () => {
    expect(OCR_CONFIDENCE.HIGH).toBeGreaterThan(0);
    expect(OCR_CONFIDENCE.HIGH).toBeLessThanOrEqual(1);
    expect(OCR_CONFIDENCE.MEDIUM).toBeGreaterThan(0);
    expect(OCR_CONFIDENCE.LOW).toBeGreaterThan(0);
  });

  it('thresholds are in descending order', () => {
    expect(OCR_CONFIDENCE.HIGH).toBeGreaterThan(OCR_CONFIDENCE.MEDIUM);
    expect(OCR_CONFIDENCE.MEDIUM).toBeGreaterThan(OCR_CONFIDENCE.LOW);
  });
});

describe('APP_LINKS', () => {
  it('has valid URL formats', () => {
    expect(APP_LINKS.APP_STORE).toMatch(/^https:\/\//);
    expect(APP_LINKS.SUPPORT_EMAIL).toMatch(/^mailto:/);
  });
});

describe('misc constants', () => {
  it('TAB_CONTENT_PADDING_BOTTOM is a positive number', () => {
    expect(TAB_CONTENT_PADDING_BOTTOM).toBeGreaterThan(0);
  });

  it('EMAIL_VERIFICATION_POLL_MS is a reasonable polling interval', () => {
    expect(EMAIL_VERIFICATION_POLL_MS).toBeGreaterThanOrEqual(1000);
    expect(EMAIL_VERIFICATION_POLL_MS).toBeLessThanOrEqual(30000);
  });
});
