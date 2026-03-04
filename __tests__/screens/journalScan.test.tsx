import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import JournalScanScreen from '@/app/journal/scan';

// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('react-native-reanimated', () => require('../helpers/reanimatedMock').reanimatedMock);

jest.mock('@/src/theme/ThemeContext', () => {
  const actual = jest.requireActual('@/src/theme/ThemeContext');
  return {
    ...actual,
    useTheme: () => ({
      colors: actual.lightColors,
      isDark: false,
      mode: 'light',
      setMode: jest.fn(),
    }),
  };
});

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success' },
}));

const mockBack = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
}));

const mockCreateEntry = jest.fn();
jest.mock('@/src/store', () => ({
  useJournalStore: () => ({
    createEntry: mockCreateEntry,
  }),
}));

const mockRequestPermission = jest.fn();
let mockPermission: { granted: boolean } | null = { granted: true };

jest.mock('expo-camera', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  const MockCameraView = React.forwardRef((props: Record<string, unknown>, _ref: unknown) => (
    <View testID="camera-view" {...props} />
  ));
  MockCameraView.displayName = 'MockCameraView';
  return {
    CameraView: MockCameraView,
    CameraType: {},
    useCameraPermissions: () => [mockPermission, mockRequestPermission],
  };
});

const mockLaunchImageLibraryAsync = jest.fn();
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: (...args: unknown[]) => mockLaunchImageLibraryAsync(...args),
}));

const mockScanHandwrittenJournal = jest.fn();
const mockHasApiKey = jest.fn();
jest.mock('@/src/services/claude', () => ({
  scanHandwrittenJournal: (...args: unknown[]) => mockScanHandwrittenJournal(...args),
  hasApiKey: () => mockHasApiKey(),
}));

jest.mock('@/src/utils/imagePersist', () => ({
  persistImage: jest.fn().mockResolvedValue('/persisted/scan.jpg'),
}));

jest.mock('lucide-react-native', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  return {
    X: (props: Record<string, unknown>) => <View testID="x-icon" {...props} />,
    Camera: (props: Record<string, unknown>) => <View testID="camera-icon" {...props} />,
    RotateCcw: (props: Record<string, unknown>) => <View testID="rotate-icon" {...props} />,
    Image: (props: Record<string, unknown>) => <View testID="image-icon" {...props} />,
    Edit3: (props: Record<string, unknown>) => <View testID="edit-icon" {...props} />,
    FileText: (props: Record<string, unknown>) => <View testID="file-text-icon" {...props} />,
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  mockPermission = { granted: true };
  mockHasApiKey.mockResolvedValue(true);
});

describe('JournalScanScreen', () => {
  it('renders empty container when permission is null', () => {
    mockPermission = null;
    const { queryByText } = render(<JournalScanScreen />);
    expect(queryByText('Camera Access Required')).toBeNull();
    expect(queryByText('Position your handwritten page in the frame')).toBeNull();
  });

  it('renders permission request when not granted', () => {
    mockPermission = { granted: false };
    const { getByText } = render(<JournalScanScreen />);
    expect(getByText('Camera Access Required')).toBeTruthy();
    expect(getByText('Grant Permission')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
  });

  it('calls requestPermission when Grant Permission is pressed', () => {
    mockPermission = { granted: false };
    const { getByText } = render(<JournalScanScreen />);
    fireEvent.press(getByText('Grant Permission'));
    expect(mockRequestPermission).toHaveBeenCalled();
  });

  it('navigates back on Cancel from permission screen', () => {
    mockPermission = { granted: false };
    const { getByText } = render(<JournalScanScreen />);
    fireEvent.press(getByText('Cancel'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('renders camera view with scan hint', () => {
    const { getByText, getByTestId } = render(<JournalScanScreen />);
    expect(getByTestId('camera-view')).toBeTruthy();
    expect(getByText('Position your handwritten page in the frame')).toBeTruthy();
  });

  it('shows reading state during transcription', async () => {
    mockLaunchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///scan.jpg' }],
    });
    mockScanHandwrittenJournal.mockImplementation(() => new Promise(() => {}));

    const { getByTestId, findByText } = render(<JournalScanScreen />);
    fireEvent.press(getByTestId('image-icon'));

    await findByText('Reading your handwriting...');
  });

  it('shows transcribed text after OCR success', async () => {
    mockLaunchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///scan.jpg' }],
    });
    mockScanHandwrittenJournal.mockResolvedValueOnce({
      text: 'Today was a wonderful day full of sunshine.',
    });

    const { getByTestId, findByText } = render(<JournalScanScreen />);
    fireEvent.press(getByTestId('image-icon'));

    await findByText('Transcribed Text');
    await findByText('Today was a wonderful day full of sunshine.');
  });

  it('shows retake and save buttons in results', async () => {
    mockLaunchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///scan.jpg' }],
    });
    mockScanHandwrittenJournal.mockResolvedValueOnce({
      text: 'Some text here.',
    });

    const { getByTestId, findByText } = render(<JournalScanScreen />);
    fireEvent.press(getByTestId('image-icon'));

    await findByText('Retake');
    await findByText('Save Entry');
  });

  it('saves scanned entry and navigates back', async () => {
    mockLaunchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///scan.jpg' }],
    });
    mockScanHandwrittenJournal.mockResolvedValueOnce({
      text: 'My journal entry from paper.',
    });
    mockCreateEntry.mockResolvedValueOnce(undefined);

    const { getByTestId, findByText } = render(<JournalScanScreen />);
    fireEvent.press(getByTestId('image-icon'));

    const saveButton = await findByText('Save Entry');
    fireEvent.press(saveButton);

    await waitFor(
      () => {
        expect(mockCreateEntry).toHaveBeenCalledWith(
          expect.objectContaining({
            content: 'My journal entry from paper.',
            isScanned: true,
            tags: ['Scanned'],
            mood: 3,
          }),
        );
      },
      { timeout: 5000 },
    );

    await waitFor(
      () => {
        expect(mockBack).toHaveBeenCalled();
      },
      { timeout: 5000 },
    );
  });

  it('shows error alert on save failure', async () => {
    jest.spyOn(Alert, 'alert');
    mockLaunchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///scan.jpg' }],
    });
    mockScanHandwrittenJournal.mockResolvedValueOnce({ text: 'Some text.' });
    mockCreateEntry.mockRejectedValueOnce(new Error('Save failed'));

    const { getByTestId, findByText } = render(<JournalScanScreen />);
    fireEvent.press(getByTestId('image-icon'));

    const saveButton = await findByText('Save Entry');
    fireEvent.press(saveButton);

    await waitFor(
      () => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Save failed');
      },
      { timeout: 5000 },
    );
  });

  it('shows API key alert when no key configured', async () => {
    jest.spyOn(Alert, 'alert');
    mockHasApiKey.mockResolvedValueOnce(false);
    mockLaunchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///scan.jpg' }],
    });

    const { getByTestId } = render(<JournalScanScreen />);
    fireEvent.press(getByTestId('image-icon'));

    await waitFor(
      () => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'API Key Required',
          'Please add your Claude API key in Settings to use handwriting recognition.',
          expect.any(Array),
        );
      },
      { timeout: 5000 },
    );
  });

  it('shows error alert on transcription failure', async () => {
    jest.spyOn(Alert, 'alert');
    mockLaunchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///scan.jpg' }],
    });
    mockScanHandwrittenJournal.mockRejectedValueOnce(new Error('OCR failed'));

    const { getByTestId } = render(<JournalScanScreen />);
    fireEvent.press(getByTestId('image-icon'));

    await waitFor(
      () => {
        expect(Alert.alert).toHaveBeenCalledWith('Transcription Failed', 'OCR failed');
      },
      { timeout: 5000 },
    );
  });

  it('does nothing when gallery picker is canceled', async () => {
    mockLaunchImageLibraryAsync.mockResolvedValueOnce({ canceled: true });

    const { getByTestId, queryByText } = render(<JournalScanScreen />);
    fireEvent.press(getByTestId('image-icon'));

    await waitFor(
      () => {
        expect(mockLaunchImageLibraryAsync).toHaveBeenCalled();
      },
      { timeout: 5000 },
    );
    expect(queryByText('Reading your handwriting...')).toBeNull();
  });
});
