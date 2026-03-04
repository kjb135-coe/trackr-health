import { getButtonVariantStyle, getButtonTextColor } from '@/src/components/ui/buttonStyles';
import { lightColors } from '@/src/theme/ThemeContext';

describe('buttonStyles', () => {
  describe('getButtonVariantStyle', () => {
    it('returns primary background', () => {
      const style = getButtonVariantStyle('primary', lightColors);
      expect(style).toEqual({ backgroundColor: lightColors.primary });
    });

    it('returns secondary background with border', () => {
      const style = getButtonVariantStyle('secondary', lightColors);
      expect(style).toEqual({
        backgroundColor: lightColors.surfaceSecondary,
        borderWidth: 1,
        borderColor: lightColors.border,
      });
    });

    it('returns transparent background for ghost', () => {
      const style = getButtonVariantStyle('ghost', lightColors);
      expect(style).toEqual({ backgroundColor: 'transparent' });
    });

    it('returns error background for danger', () => {
      const style = getButtonVariantStyle('danger', lightColors);
      expect(style).toEqual({ backgroundColor: lightColors.error });
    });
  });

  describe('getButtonTextColor', () => {
    it('returns white for primary', () => {
      expect(getButtonTextColor('primary', lightColors)).toBe(lightColors.white);
    });

    it('returns white for danger', () => {
      expect(getButtonTextColor('danger', lightColors)).toBe(lightColors.white);
    });

    it('returns textPrimary for secondary', () => {
      expect(getButtonTextColor('secondary', lightColors)).toBe(lightColors.textPrimary);
    });

    it('returns primary color for ghost', () => {
      expect(getButtonTextColor('ghost', lightColors)).toBe(lightColors.primary);
    });
  });
});
