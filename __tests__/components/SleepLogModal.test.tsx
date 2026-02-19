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
const mockUpdateEntry = jest.fn();
jest.mock('@/src/store', () => ({
  useSleepStore: () => ({
    createEntry: mockCreateEntry,
    updateEntry: mockUpdateEntry,
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
    await findByText('Log Sleep');
  });

  it('renders bedtime and wake time labels', async () => {
    const { findByText } = renderWithTheme(<SleepLogModal visible={true} onClose={() => {}} />);
    await findByText('Bedtime');
    await findByText('Wake Time');
  });

  it('renders sleep quality label and quality options', async () => {
    const { findByText } = renderWithTheme(<SleepLogModal visible={true} onClose={() => {}} />);
    await findByText('Sleep Quality');
    await findByText('1');
    await findByText('5');
  });

  it('renders save button', async () => {
    const { findByText } = renderWithTheme(<SleepLogModal visible={true} onClose={() => {}} />);
    await findByText('Save Sleep Entry');
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

  it('shows alert for invalid wake time', async () => {
    const { findByText, findAllByDisplayValue } = renderWithTheme(
      <SleepLogModal visible={true} onClose={() => {}} />,
    );

    const hourInputs = await findAllByDisplayValue('07');
    fireEvent.changeText(hourInputs[0], '25');

    fireEvent.press(await findByText('Save Sleep Entry'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Invalid wake time',
      'Hours must be 0-23 and minutes 0-59.',
    );
  });

  it('shows edit title and pre-fills values from editEntry', async () => {
    const editEntry = {
      id: 's1',
      date: '2026-02-18',
      bedtime: '2026-02-17T23:30:00.000Z',
      wakeTime: '2026-02-18T06:45:00.000Z',
      durationMinutes: 435,
      quality: 4 as const,
      createdAt: '2026-02-18T00:00:00.000Z',
      updatedAt: '2026-02-18T00:00:00.000Z',
    };

    const { findByText, findByDisplayValue } = renderWithTheme(
      <SleepLogModal visible={true} onClose={() => {}} editEntry={editEntry} />,
    );

    await findByText('Edit Sleep');
    await findByText('Update Sleep Entry');
  });

  it('calls updateEntry when saving in edit mode', async () => {
    mockUpdateEntry.mockResolvedValue(undefined);
    const onClose = jest.fn();

    const editEntry = {
      id: 's1',
      date: '2026-02-18',
      bedtime: '2026-02-17T22:00:00.000Z',
      wakeTime: '2026-02-18T07:00:00.000Z',
      durationMinutes: 540,
      quality: 3 as const,
      createdAt: '2026-02-18T00:00:00.000Z',
      updatedAt: '2026-02-18T00:00:00.000Z',
    };

    const { findByText } = renderWithTheme(
      <SleepLogModal visible={true} onClose={onClose} editEntry={editEntry} />,
    );

    fireEvent.press(await findByText('Update Sleep Entry'));

    await waitFor(() => {
      expect(mockUpdateEntry).toHaveBeenCalledWith(
        's1',
        expect.objectContaining({
          quality: 3,
        }),
      );
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('shows error alert when save fails', async () => {
    mockCreateEntry.mockRejectedValueOnce(new Error('DB error'));

    const { findByText } = renderWithTheme(<SleepLogModal visible={true} onClose={() => {}} />);

    fireEvent.press(await findByText('Save Sleep Entry'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Save failed', 'DB error');
    });
  });
});
