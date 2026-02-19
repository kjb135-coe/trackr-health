import { getQualityColor, estimateCalories } from '@/src/utils/constants';

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
