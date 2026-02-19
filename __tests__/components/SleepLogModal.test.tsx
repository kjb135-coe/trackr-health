import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ThemeProvider } from '@/src/theme/ThemeContext';
import { SleepLogModal } from '@/src/components/sleep/SleepLogModal';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockCreateEntry = jest.fn();
jest.mock('@/src/store', () => ({
  useSleepStore: () => ({
    createEntry: mockCreateEntry,
  }),
}));

jest.spyOn(Alert, 'alert');

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('SleepLogModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal title when visible', async () => {
    const { findByText } = renderWithTheme(<SleepLogModal visible={true} onClose={() => {}} />);
    expect(await findByText('Log Sleep')).toBeTruthy();
  });

  it('renders bedtime and wake time labels', async () => {
    const { findByText } = renderWithTheme(<SleepLogModal visible={true} onClose={() => {}} />);
    expect(await findByText('Bedtime')).toBeTruthy();
    expect(await findByText('Wake Time')).toBeTruthy();
  });

  it('renders sleep quality label and quality options', async () => {
    const { findByText } = renderWithTheme(<SleepLogModal visible={true} onClose={() => {}} />);
    expect(await findByText('Sleep Quality')).toBeTruthy();
    expect(await findByText('1')).toBeTruthy();
    expect(await findByText('5')).toBeTruthy();
  });

  it('renders save button', async () => {
    const { findByText } = renderWithTheme(<SleepLogModal visible={true} onClose={() => {}} />);
    expect(await findByText('Save Sleep Entry')).toBeTruthy();
  });

  it('calls createEntry and onClose when form is submitted with valid times', async () => {
    mockCreateEntry.mockResolvedValue(undefined);
    const onClose = jest.fn();

    const { findByText } = renderWithTheme(<SleepLogModal visible={true} onClose={onClose} />);

    const saveButton = await findByText('Save Sleep Entry');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockCreateEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          quality: 3,
        }),
      );
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('shows alert for invalid bedtime hours', async () => {
    const onClose = jest.fn();

    const { findByText, findAllByDisplayValue } = renderWithTheme(
      <SleepLogModal visible={true} onClose={onClose} />,
    );

    // Change bedtime hour to invalid value
    const hourInputs = await findAllByDisplayValue('22');
    fireEvent.changeText(hourInputs[0], '25');

    const saveButton = await findByText('Save Sleep Entry');
    fireEvent.press(saveButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Invalid bedtime',
      'Hours must be 0-23 and minutes 0-59.',
    );
    expect(mockCreateEntry).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
