import { getQualityColor } from '@/src/utils/constants';

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
