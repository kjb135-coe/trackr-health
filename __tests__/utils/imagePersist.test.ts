import { persistImage, deleteImage, clearAllImages } from '@/src/utils/imagePersist';

const mockGetInfoAsync = jest.fn();
const mockMakeDirectoryAsync = jest.fn();
const mockCopyAsync = jest.fn();
const mockDeleteAsync = jest.fn();

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///docs/',
  getInfoAsync: (...args: unknown[]) => mockGetInfoAsync(...args),
  makeDirectoryAsync: (...args: unknown[]) => mockMakeDirectoryAsync(...args),
  copyAsync: (...args: unknown[]) => mockCopyAsync(...args),
  deleteAsync: (...args: unknown[]) => mockDeleteAsync(...args),
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

describe('deleteImage', () => {
  it('deletes file at given URI', async () => {
    mockDeleteAsync.mockResolvedValue(undefined);

    await deleteImage('file:///docs/images/123-abc.jpg');

    expect(mockDeleteAsync).toHaveBeenCalledWith('file:///docs/images/123-abc.jpg', {
      idempotent: true,
    });
  });

  it('silently handles deletion errors', async () => {
    mockDeleteAsync.mockRejectedValue(new Error('File not found'));

    await expect(deleteImage('file:///docs/images/missing.jpg')).resolves.toBeUndefined();
  });

  it('skips deletion for undefined URI', async () => {
    await deleteImage(undefined);

    expect(mockDeleteAsync).not.toHaveBeenCalled();
  });

  it('skips deletion for empty string URI', async () => {
    await deleteImage('');

    expect(mockDeleteAsync).not.toHaveBeenCalled();
  });
});

describe('clearAllImages', () => {
  it('deletes the entire images directory', async () => {
    mockDeleteAsync.mockResolvedValue(undefined);

    await clearAllImages();

    expect(mockDeleteAsync).toHaveBeenCalledWith('file:///docs/images/', { idempotent: true });
  });

  it('silently handles errors', async () => {
    mockDeleteAsync.mockRejectedValue(new Error('Dir not found'));

    await expect(clearAllImages()).resolves.toBeUndefined();
  });
});
