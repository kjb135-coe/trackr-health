import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ThemeProvider } from '@/src/theme/ThemeContext';
import { JournalEntryModal } from '@/src/components/journal/JournalEntryModal';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  launchCameraAsync: jest.fn(() => Promise.resolve({ canceled: true })),
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({ canceled: true })),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ImagePicker = require('expo-image-picker');

const mockCreateEntry = jest.fn();
const mockUpdateEntry = jest.fn();
const mockScanImage = jest.fn();
jest.mock('@/src/store', () => ({
  useJournalStore: () => ({
    isLoading: false,
    isScanning: false,
    createEntry: mockCreateEntry,
    updateEntry: mockUpdateEntry,
    scanImage: mockScanImage,
  }),
}));

jest.spyOn(Alert, 'alert');

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('JournalEntryModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal title for new text entry', async () => {
    const { findByText } = renderWithTheme(
      <JournalEntryModal
        visible={true}
        initialMode="text"
        onClose={() => {}}
        apiKeyExists={false}
      />,
    );
    expect(await findByText('New Entry')).toBeTruthy();
  });

  it('renders modal title for scan mode', async () => {
    const { findByText } = renderWithTheme(
      <JournalEntryModal
        visible={true}
        initialMode="scan"
        onClose={() => {}}
        apiKeyExists={false}
      />,
    );
    expect(await findByText('Scan Journal')).toBeTruthy();
  });

  it('renders form labels and inputs', async () => {
    const { findByText, findByPlaceholderText } = renderWithTheme(
      <JournalEntryModal
        visible={true}
        initialMode="text"
        onClose={() => {}}
        apiKeyExists={false}
      />,
    );
    expect(await findByText('Title (optional)')).toBeTruthy();
    expect(await findByText('Content')).toBeTruthy();
    expect(await findByText('How are you feeling?')).toBeTruthy();
    expect(await findByPlaceholderText('Give your entry a title')).toBeTruthy();
    expect(await findByPlaceholderText('Write your thoughts...')).toBeTruthy();
  });

  it('renders save button', async () => {
    const { findByText } = renderWithTheme(
      <JournalEntryModal
        visible={true}
        initialMode="text"
        onClose={() => {}}
        apiKeyExists={false}
      />,
    );
    expect(await findByText('Save Entry')).toBeTruthy();
  });

  it('does not call createEntry when content is empty (button disabled)', async () => {
    const { findByText } = renderWithTheme(
      <JournalEntryModal
        visible={true}
        initialMode="text"
        onClose={() => {}}
        apiKeyExists={false}
      />,
    );

    const saveButton = await findByText('Save Entry');
    fireEvent.press(saveButton);

    expect(mockCreateEntry).not.toHaveBeenCalled();
  });

  it('calls createEntry and onClose when form is submitted', async () => {
    mockCreateEntry.mockResolvedValue(undefined);
    const onClose = jest.fn();

    const { findByText, findByPlaceholderText } = renderWithTheme(
      <JournalEntryModal
        visible={true}
        initialMode="text"
        onClose={onClose}
        apiKeyExists={false}
        date="2026-02-18"
      />,
    );

    const titleInput = await findByPlaceholderText('Give your entry a title');
    fireEvent.changeText(titleInput, 'Great Day');

    const contentInput = await findByPlaceholderText('Write your thoughts...');
    fireEvent.changeText(contentInput, 'Today was wonderful!');

    const saveButton = await findByText('Save Entry');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockCreateEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          date: '2026-02-18',
          title: 'Great Day',
          content: 'Today was wonderful!',
          isScanned: false,
        }),
      );
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('shows edit title and calls updateEntry when editing', async () => {
    mockUpdateEntry.mockResolvedValue(undefined);
    const onClose = jest.fn();

    const editEntry = {
      id: 'entry-1',
      date: '2026-02-18',
      title: 'My Day',
      content: 'Some thoughts',
      mood: 4 as const,
      isScanned: false,
      createdAt: '2026-02-18T08:00:00.000Z',
      updatedAt: '2026-02-18T08:00:00.000Z',
    };

    const { findByText, findByDisplayValue } = renderWithTheme(
      <JournalEntryModal
        visible={true}
        initialMode="text"
        onClose={onClose}
        apiKeyExists={false}
        editEntry={editEntry}
      />,
    );

    expect(await findByText('Edit Entry')).toBeTruthy();
    expect(await findByText('Update Entry')).toBeTruthy();
    expect(await findByDisplayValue('My Day')).toBeTruthy();
    expect(await findByDisplayValue('Some thoughts')).toBeTruthy();
  });

  it('renders mode toggle with Type and Scan options', async () => {
    const { findByText } = renderWithTheme(
      <JournalEntryModal
        visible={true}
        initialMode="text"
        onClose={() => {}}
        apiKeyExists={false}
      />,
    );

    expect(await findByText('Type')).toBeTruthy();
    expect(await findByText('Scan')).toBeTruthy();
  });

  it('shows camera buttons in scan mode', async () => {
    const { findByText } = renderWithTheme(
      <JournalEntryModal
        visible={true}
        initialMode="scan"
        onClose={() => {}}
        apiKeyExists={false}
      />,
    );

    expect(await findByText('Take Photo')).toBeTruthy();
    expect(await findByText('Gallery')).toBeTruthy();
  });

  it('shows alert when camera permission is denied', async () => {
    ImagePicker.requestCameraPermissionsAsync.mockResolvedValueOnce({ granted: false });

    const { findByText } = renderWithTheme(
      <JournalEntryModal
        visible={true}
        initialMode="scan"
        onClose={() => {}}
        apiKeyExists={true}
      />,
    );

    fireEvent.press(await findByText('Take Photo'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Permission needed',
        'Please grant camera permission to scan your journal.',
      );
    });
  });

  it('shows alert when library permission is denied', async () => {
    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({ granted: false });

    const { findByText } = renderWithTheme(
      <JournalEntryModal
        visible={true}
        initialMode="scan"
        onClose={() => {}}
        apiKeyExists={true}
      />,
    );

    fireEvent.press(await findByText('Gallery'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Permission needed',
        'Please grant photo library permission.',
      );
    });
  });

  it('scans photo and populates content with OCR text', async () => {
    ImagePicker.launchCameraAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://scan.jpg' }],
    });
    mockScanImage.mockResolvedValueOnce({ text: 'Handwritten journal text here' });

    const { findByText, findByDisplayValue } = renderWithTheme(
      <JournalEntryModal
        visible={true}
        initialMode="scan"
        onClose={() => {}}
        apiKeyExists={true}
      />,
    );

    fireEvent.press(await findByText('Take Photo'));

    await waitFor(() => {
      expect(mockScanImage).toHaveBeenCalledWith('file://scan.jpg');
    });
    expect(await findByDisplayValue('Handwritten journal text here')).toBeTruthy();
  });

  it('shows scan failed alert when OCR throws', async () => {
    ImagePicker.launchCameraAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://scan.jpg' }],
    });
    mockScanImage.mockRejectedValueOnce(new Error('OCR error'));

    const { findByText } = renderWithTheme(
      <JournalEntryModal
        visible={true}
        initialMode="scan"
        onClose={() => {}}
        apiKeyExists={true}
      />,
    );

    fireEvent.press(await findByText('Take Photo'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Scan failed',
        'Could not read the handwriting. Please try again or type manually.',
      );
    });
  });

  it('shows API key needed alert when scanning without API key', async () => {
    ImagePicker.launchCameraAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://scan.jpg' }],
    });

    const { findByText } = renderWithTheme(
      <JournalEntryModal
        visible={true}
        initialMode="scan"
        onClose={() => {}}
        apiKeyExists={false}
      />,
    );

    fireEvent.press(await findByText('Take Photo'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'API key needed',
        'Add your Claude API key in settings to enable handwriting recognition.',
      );
    });
  });

  it('shows error alert when save fails', async () => {
    mockCreateEntry.mockRejectedValueOnce(new Error('DB write failed'));

    const { findByText, findByPlaceholderText } = renderWithTheme(
      <JournalEntryModal
        visible={true}
        initialMode="text"
        onClose={() => {}}
        apiKeyExists={false}
      />,
    );

    fireEvent.changeText(await findByPlaceholderText('Write your thoughts...'), 'Some content');
    fireEvent.press(await findByText('Save Entry'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Save failed', 'DB write failed');
    });
  });

  it('calls updateEntry when saving in edit mode', async () => {
    mockUpdateEntry.mockResolvedValue(undefined);
    const onClose = jest.fn();

    const editEntry = {
      id: 'entry-1',
      date: '2026-02-18',
      title: 'My Day',
      content: 'Some thoughts',
      mood: 4 as const,
      isScanned: false,
      createdAt: '2026-02-18T08:00:00.000Z',
      updatedAt: '2026-02-18T08:00:00.000Z',
    };

    const { findByText } = renderWithTheme(
      <JournalEntryModal
        visible={true}
        initialMode="text"
        onClose={onClose}
        apiKeyExists={false}
        editEntry={editEntry}
      />,
    );

    fireEvent.press(await findByText('Update Entry'));

    await waitFor(() => {
      expect(mockUpdateEntry).toHaveBeenCalledWith(
        'entry-1',
        expect.objectContaining({
          title: 'My Day',
          content: 'Some thoughts',
          mood: 4,
        }),
      );
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });
});
