import { getMediaType } from '@/src/services/claude/imageUtils';

describe('getMediaType', () => {
  it('returns image/png for .png files', () => {
    expect(getMediaType('/path/to/photo.png')).toBe('image/png');
  });

  it('returns image/png for .PNG files (case-insensitive)', () => {
    expect(getMediaType('/path/to/photo.PNG')).toBe('image/png');
  });

  it('returns image/jpeg for .jpg files', () => {
    expect(getMediaType('/path/to/photo.jpg')).toBe('image/jpeg');
  });

  it('returns image/jpeg for .jpeg files', () => {
    expect(getMediaType('/path/to/photo.jpeg')).toBe('image/jpeg');
  });

  it('returns image/jpeg for unknown extensions', () => {
    expect(getMediaType('/path/to/photo.bmp')).toBe('image/jpeg');
  });
});
