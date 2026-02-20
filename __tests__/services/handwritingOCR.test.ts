import { scanHandwrittenJournal } from '@/src/services/claude/handwritingOCR';
import { OCR_CONFIDENCE } from '@/src/utils/constants';

const mockCreate = jest.fn();

jest.mock('@/src/services/claude/client', () => ({
  getClaudeClient: jest.fn().mockResolvedValue({
    messages: { create: (...args: unknown[]) => mockCreate(...args) },
  }),
}));

jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn().mockResolvedValue('base64data'),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('scanHandwrittenJournal', () => {
  it('transcribes handwritten text with high confidence', async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: 'Today was a wonderful day at the park.\n---\nConfidence: high',
        },
      ],
    });

    const result = await scanHandwrittenJournal('/path/to/image.jpg');

    expect(result.text).toBe('Today was a wonderful day at the park.');
    expect(result.confidence).toBe(OCR_CONFIDENCE.HIGH);
    expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
    expect(result.rawResponse).toContain('Confidence: high');
  });

  it('handles medium confidence', async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: 'Some harder to read text.\n---\nConfidence: medium',
        },
      ],
    });

    const result = await scanHandwrittenJournal('/path/to/image.jpg');

    expect(result.confidence).toBe(OCR_CONFIDENCE.MEDIUM);
  });

  it('handles low confidence', async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: 'Barely legible.\n---\nConfidence: low',
        },
      ],
    });

    const result = await scanHandwrittenJournal('/path/to/image.jpg');

    expect(result.confidence).toBe(OCR_CONFIDENCE.LOW);
  });

  it('defaults to medium confidence when no marker present', async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: 'Just plain transcribed text without confidence marker.',
        },
      ],
    });

    const result = await scanHandwrittenJournal('/path/to/image.jpg');

    expect(result.text).toBe('Just plain transcribed text without confidence marker.');
    expect(result.confidence).toBe(OCR_CONFIDENCE.MEDIUM);
  });

  it('throws when response has no text content', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'image', source: {} }],
    });

    await expect(scanHandwrittenJournal('/path/to/image.jpg')).rejects.toThrow(
      'No text response from Claude',
    );
  });

  it('detects PNG media type from URI', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Text\n---\nConfidence: high' }],
    });

    await scanHandwrittenJournal('/path/to/image.PNG');

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            content: expect.arrayContaining([
              expect.objectContaining({
                source: expect.objectContaining({ media_type: 'image/png' }),
              }),
            ]),
          }),
        ]),
      }),
    );
  });

  it('uses JPEG media type for non-PNG URIs', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Text\n---\nConfidence: high' }],
    });

    await scanHandwrittenJournal('/path/to/image.jpg');

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            content: expect.arrayContaining([
              expect.objectContaining({
                source: expect.objectContaining({ media_type: 'image/jpeg' }),
              }),
            ]),
          }),
        ]),
      }),
    );
  });
});
