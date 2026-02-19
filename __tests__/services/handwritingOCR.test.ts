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
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('scanHandwrittenJournal', () => {
  it('returns transcribed text with high confidence', async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: 'Today was a great day.\n---\nConfidence: high',
        },
      ],
    });

    const resultPromise = scanHandwrittenJournal('photo.jpg');
    jest.runAllTimers();
    const result = await resultPromise;

    expect(result.text).toBe('Today was a great day.');
    expect(result.confidence).toBe(OCR_CONFIDENCE.HIGH);
    expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
    expect(result.rawResponse).toContain('Confidence: high');
  });

  it('returns medium confidence when marker is medium', async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: 'Some text here.\n---\nConfidence: medium',
        },
      ],
    });

    const resultPromise = scanHandwrittenJournal('photo.jpg');
    jest.runAllTimers();
    const result = await resultPromise;

    expect(result.confidence).toBe(OCR_CONFIDENCE.MEDIUM);
  });

  it('returns low confidence when marker is low', async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: 'Hard to read.\n---\nConfidence: low',
        },
      ],
    });

    const resultPromise = scanHandwrittenJournal('photo.jpg');
    jest.runAllTimers();
    const result = await resultPromise;

    expect(result.confidence).toBe(OCR_CONFIDENCE.LOW);
  });

  it('defaults to medium confidence when no marker present', async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: 'Just some transcribed text without a confidence marker.',
        },
      ],
    });

    const resultPromise = scanHandwrittenJournal('photo.jpg');
    jest.runAllTimers();
    const result = await resultPromise;

    expect(result.text).toBe('Just some transcribed text without a confidence marker.');
    expect(result.confidence).toBe(OCR_CONFIDENCE.MEDIUM);
  });

  it('throws timeout error when API is slow', async () => {
    mockCreate.mockReturnValue(
      new Promise(() => {
        // Never resolves — simulates a hung API call
      }),
    );

    const resultPromise = scanHandwrittenJournal('photo.jpg');

    // Flush microtasks for getClaudeClient and readAsStringAsync
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    jest.advanceTimersByTime(30000);

    await expect(resultPromise).rejects.toThrow('Handwriting scan timed out. Please try again.');
  });

  it('throws on non-text response', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'image', source: {} }],
    });

    const resultPromise = scanHandwrittenJournal('photo.jpg');
    jest.runAllTimers();

    await expect(resultPromise).rejects.toThrow('No text response from Claude');
  });

  it('uses correct media type for PNG images', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Text.\n---\nConfidence: high' }],
    });

    const resultPromise = scanHandwrittenJournal('photo.png');
    jest.runAllTimers();
    await resultPromise;

    const callArgs = mockCreate.mock.calls[0][0];
    const imageBlock = callArgs.messages[0].content[0];
    expect(imageBlock.source.media_type).toBe('image/png');
  });

  it('uses jpeg media type for non-PNG images', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Text.\n---\nConfidence: high' }],
    });

    const resultPromise = scanHandwrittenJournal('photo.jpg');
    jest.runAllTimers();
    await resultPromise;

    const callArgs = mockCreate.mock.calls[0][0];
    const imageBlock = callArgs.messages[0].content[0];
    expect(imageBlock.source.media_type).toBe('image/jpeg');
  });

  it('preserves multiline text with paragraph breaks', async () => {
    const multilineText = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.';
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: `${multilineText}\n---\nConfidence: high`,
        },
      ],
    });

    const resultPromise = scanHandwrittenJournal('photo.jpg');
    jest.runAllTimers();
    const result = await resultPromise;

    expect(result.text).toBe(multilineText);
  });
});
