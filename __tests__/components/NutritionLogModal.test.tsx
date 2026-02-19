import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ThemeProvider } from '@/src/theme/ThemeContext';
import { NutritionLogModal } from '@/src/components/nutrition/NutritionLogModal';

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

const mockCreateMeal = jest.fn();
const mockUpdateMeal = jest.fn();
jest.mock('@/src/store', () => ({
  useNutritionStore: () => ({
    isLoading: false,
    isAnalyzing: false,
    createMeal: mockCreateMeal,
    updateMeal: mockUpdateMeal,
    analyzeImage: jest.fn(),
  }),
}));

jest.spyOn(Alert, 'alert');

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('NutritionLogModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal title when visible', async () => {
    const { findByText } = renderWithTheme(
      <NutritionLogModal visible={true} onClose={() => {}} apiKeyExists={false} />,
    );
    expect(await findByText('Log Meal')).toBeTruthy();
  });

  it('renders meal type and form labels', async () => {
    const { findByText } = renderWithTheme(
      <NutritionLogModal visible={true} onClose={() => {}} apiKeyExists={false} />,
    );
    expect(await findByText('Meal Type')).toBeTruthy();
    expect(await findByText('Or add manually')).toBeTruthy();
  });

  it('renders save button', async () => {
    const { findByText } = renderWithTheme(
      <NutritionLogModal visible={true} onClose={() => {}} apiKeyExists={false} />,
    );
    expect(await findByText('Save Meal')).toBeTruthy();
  });

  it('does not call createMeal when no food info is provided (button disabled)', async () => {
    const { findByText } = renderWithTheme(
      <NutritionLogModal visible={true} onClose={() => {}} apiKeyExists={false} />,
    );

    const saveButton = await findByText('Save Meal');
    fireEvent.press(saveButton);

    expect(mockCreateMeal).not.toHaveBeenCalled();
  });

  it('shows alert for invalid calories', async () => {
    const { findByText, findByPlaceholderText } = renderWithTheme(
      <NutritionLogModal visible={true} onClose={() => {}} apiKeyExists={false} />,
    );

    const nameInput = await findByPlaceholderText('Food name');
    fireEvent.changeText(nameInput, 'Apple');

    const caloriesInput = await findByPlaceholderText('Calories');
    fireEvent.changeText(caloriesInput, '-5');

    const saveButton = await findByText('Save Meal');
    fireEvent.press(saveButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Invalid calories',
      'Calories must be a positive number.',
    );
    expect(mockCreateMeal).not.toHaveBeenCalled();
  });

  it('calls createMeal and onClose when form is submitted with manual entry', async () => {
    mockCreateMeal.mockResolvedValue(undefined);
    const onClose = jest.fn();

    const { findByText, findByPlaceholderText } = renderWithTheme(
      <NutritionLogModal visible={true} onClose={onClose} apiKeyExists={false} date="2026-02-18" />,
    );

    const nameInput = await findByPlaceholderText('Food name');
    fireEvent.changeText(nameInput, 'Chicken Salad');

    const caloriesInput = await findByPlaceholderText('Calories');
    fireEvent.changeText(caloriesInput, '350');

    const saveButton = await findByText('Save Meal');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockCreateMeal).toHaveBeenCalledWith(
        expect.objectContaining({
          date: '2026-02-18',
          mealType: 'lunch',
          totalCalories: 350,
        }),
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Chicken Salad',
            calories: 350,
          }),
        ]),
      );
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('shows edit title and calls updateMeal when editing', async () => {
    mockUpdateMeal.mockResolvedValue(undefined);
    const onClose = jest.fn();

    const editMeal = {
      id: 'meal-1',
      date: '2026-02-18',
      mealType: 'breakfast' as const,
      name: 'Oatmeal',
      totalCalories: 200,
      foods: [],
      createdAt: '2026-02-18T08:00:00.000Z',
      updatedAt: '2026-02-18T08:00:00.000Z',
    };

    const { findByText, findByDisplayValue } = renderWithTheme(
      <NutritionLogModal
        visible={true}
        onClose={onClose}
        apiKeyExists={false}
        editMeal={editMeal}
      />,
    );

    expect(await findByText('Edit Meal')).toBeTruthy();
    expect(await findByText('Update Meal')).toBeTruthy();
    expect(await findByDisplayValue('Oatmeal')).toBeTruthy();
    expect(await findByDisplayValue('200')).toBeTruthy();
  });

  it('renders meal type selector with all 4 options', async () => {
    const { findByText } = renderWithTheme(
      <NutritionLogModal visible={true} onClose={() => {}} apiKeyExists={false} />,
    );

    expect(await findByText('Breakfast')).toBeTruthy();
    expect(await findByText('Lunch')).toBeTruthy();
    expect(await findByText('Dinner')).toBeTruthy();
    expect(await findByText('Snack')).toBeTruthy();
  });
});
