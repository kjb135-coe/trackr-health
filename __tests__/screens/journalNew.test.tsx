import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import NewJournalEntryScreen from '@/app/journal/new';

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
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, replace: mockReplace }),
}));

const mockCreateEntry = jest.fn();
jest.mock('@/src/store', () => ({
  useJournalStore: () => ({
    createEntry: mockCreateEntry,
  }),
}));

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return {
    X: (props: Record<string, unknown>) => <View testID="x-icon" {...props} />,
    Smile: (props: Record<string, unknown>) => <View testID="smile-icon" {...props} />,
    Meh: (props: Record<string, unknown>) => <View testID="meh-icon" {...props} />,
    Frown: (props: Record<string, unknown>) => <View testID="frown-icon" {...props} />,
    Camera: (props: Record<string, unknown>) => <View testID="camera-icon" {...props} />,
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('NewJournalEntryScreen', () => {
  it('renders title and section headers', () => {
    const { getByText } = render(<NewJournalEntryScreen />);
    expect(getByText('New Entry')).toBeTruthy();
    expect(getByText('How are you feeling?')).toBeTruthy();
    expect(getByText('Tags')).toBeTruthy();
  });

  it('renders title and content input placeholders', () => {
    const { getByPlaceholderText } = render(<NewJournalEntryScreen />);
    expect(getByPlaceholderText('Title (optional)')).toBeTruthy();
    expect(getByPlaceholderText("What's on your mind today?")).toBeTruthy();
  });

  it('renders all 5 mood options', () => {
    const { getByText } = render(<NewJournalEntryScreen />);
    expect(getByText('Terrible')).toBeTruthy();
    expect(getByText('Bad')).toBeTruthy();
    expect(getByText('Okay')).toBeTruthy();
    expect(getByText('Good')).toBeTruthy();
    expect(getByText('Great')).toBeTruthy();
  });

  it('renders all 12 quick tags', () => {
    const { getByText } = render(<NewJournalEntryScreen />);
    expect(getByText('Work')).toBeTruthy();
    expect(getByText('Health')).toBeTruthy();
    expect(getByText('Family')).toBeTruthy();
    expect(getByText('Friends')).toBeTruthy();
    expect(getByText('Exercise')).toBeTruthy();
    expect(getByText('Travel')).toBeTruthy();
    expect(getByText('Learning')).toBeTruthy();
    expect(getByText('Creativity')).toBeTruthy();
    expect(getByText('Gratitude')).toBeTruthy();
    expect(getByText('Goals')).toBeTruthy();
    expect(getByText('Reflection')).toBeTruthy();
    expect(getByText('Ideas')).toBeTruthy();
  });

  it('shows validation error when saving with empty content', () => {
    jest.spyOn(Alert, 'alert');
    const { getByText } = render(<NewJournalEntryScreen />);
    fireEvent.press(getByText('Save Entry'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Error',
      'Please write something in your journal entry',
    );
    expect(mockCreateEntry).not.toHaveBeenCalled();
  });

  it('saves entry with content and navigates back', async () => {
    mockCreateEntry.mockResolvedValueOnce(undefined);
    const { getByText, getByPlaceholderText } = render(<NewJournalEntryScreen />);

    fireEvent.changeText(getByPlaceholderText("What's on your mind today?"), 'Had a great day!');
    fireEvent.press(getByText('Save Entry'));

    await waitFor(() => {
      expect(mockCreateEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Had a great day!',
          mood: 3,
          tags: [],
          isScanned: false,
        }),
      );
    });

    await waitFor(() => {
      expect(mockBack).toHaveBeenCalled();
    });
  });

  it('saves entry with custom title when provided', async () => {
    mockCreateEntry.mockResolvedValueOnce(undefined);
    const { getByText, getByPlaceholderText } = render(<NewJournalEntryScreen />);

    fireEvent.changeText(getByPlaceholderText('Title (optional)'), 'My Day');
    fireEvent.changeText(getByPlaceholderText("What's on your mind today?"), 'Some content');
    fireEvent.press(getByText('Save Entry'));

    await waitFor(() => {
      expect(mockCreateEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'My Day',
          content: 'Some content',
        }),
      );
    });
  });

  it('shows error alert on save failure', async () => {
    jest.spyOn(Alert, 'alert');
    mockCreateEntry.mockRejectedValueOnce(new Error('Save failed'));
    const { getByText, getByPlaceholderText } = render(<NewJournalEntryScreen />);

    fireEvent.changeText(getByPlaceholderText("What's on your mind today?"), 'Content');
    fireEvent.press(getByText('Save Entry'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Save failed');
    });
  });

  it('navigates back when close button is pressed', () => {
    const { getByTestId } = render(<NewJournalEntryScreen />);
    fireEvent.press(getByTestId('x-icon'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('navigates to scan screen when camera button is pressed', () => {
    const { getByTestId } = render(<NewJournalEntryScreen />);
    fireEvent.press(getByTestId('camera-icon'));
    expect(mockReplace).toHaveBeenCalledWith('/journal/scan');
  });

  it('renders save button', () => {
    const { getByText } = render(<NewJournalEntryScreen />);
    expect(getByText('Save Entry')).toBeTruthy();
  });
});
