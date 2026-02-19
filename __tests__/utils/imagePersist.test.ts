import { persistImage } from '@/src/utils/imagePersist';

const mockGetInfoAsync = jest.fn();
const mockMakeDirectoryAsync = jest.fn();
const mockCopyAsync = jest.fn();

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///docs/',
  getInfoAsync: (...args: unknown[]) => mockGetInfoAsync(...args),
  makeDirectoryAsync: (...args: unknown[]) => mockMakeDirectoryAsync(...args),
  copyAsync: (...args: unknown[]) => mockCopyAsync(...args),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('persistImage', () => {
  it('copies image to permanent directory', async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: true });
    mockCopyAsync.mockResolvedValue(undefined);

    const result = await persistImage('file:///tmp/photo.jpg');

    expect(result).toMatch(/^file:\/\/\/docs\/images\/\d+-[a-z0-9]+\.jpg$/);
    expect(mockCopyAsync).toHaveBeenCalledWith({
      from: 'file:///tmp/photo.jpg',
      to: expect.stringContaining('file:///docs/images/'),
    });
  });

  it('creates images directory if it does not exist', async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: false });
    mockMakeDirectoryAsync.mockResolvedValue(undefined);
    mockCopyAsync.mockResolvedValue(undefined);

    await persistImage('file:///tmp/photo.jpg');

    expect(mockMakeDirectoryAsync).toHaveBeenCalledWith('file:///docs/images/', {
      intermediates: true,
    });
  });

  it('skips directory creation if it already exists', async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: true });
    mockCopyAsync.mockResolvedValue(undefined);

    await persistImage('file:///tmp/photo.jpg');

    expect(mockMakeDirectoryAsync).not.toHaveBeenCalled();
  });

  it('returns original URI on failure', async () => {
    mockGetInfoAsync.mockRejectedValue(new Error('Disk full'));

    const result = await persistImage('file:///tmp/photo.jpg');

    expect(result).toBe('file:///tmp/photo.jpg');
  });
});
