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

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ImagePicker = require('expo-image-picker');

const mockCreateMeal = jest.fn();
const mockUpdateMeal = jest.fn();
const mockAnalyzeImage = jest.fn();
jest.mock('@/src/store', () => ({
  useNutritionStore: () => ({
    isLoading: false,
    isAnalyzing: false,
    createMeal: mockCreateMeal,
    updateMeal: mockUpdateMeal,
    analyzeImage: mockAnalyzeImage,
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
    await findByText('Log Meal');
  });

  it('renders meal type and form labels', async () => {
    const { findByText } = renderWithTheme(
      <NutritionLogModal visible={true} onClose={() => {}} apiKeyExists={false} />,
    );
    await findByText('Meal Type');
    await findByText('Or add manually');
  });

  it('renders save button', async () => {
    const { findByText } = renderWithTheme(
      <NutritionLogModal visible={true} onClose={() => {}} apiKeyExists={false} />,
    );
    await findByText('Save Meal');
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

    await findByText('Edit Meal');
    await findByText('Update Meal');
    await findByDisplayValue('Oatmeal');
    await findByDisplayValue('200');
  });

  it('renders meal type selector with all 4 options', async () => {
    const { findByText } = renderWithTheme(
      <NutritionLogModal visible={true} onClose={() => {}} apiKeyExists={false} />,
    );

    await findByText('Breakfast');
    await findByText('Lunch');
    await findByText('Dinner');
    await findByText('Snack');
  });

  it('shows alert when camera permission is denied', async () => {
    ImagePicker.requestCameraPermissionsAsync.mockResolvedValueOnce({ granted: false });

    const { findByText } = renderWithTheme(
      <NutritionLogModal visible={true} onClose={() => {}} apiKeyExists={true} />,
    );

    fireEvent.press(await findByText('Take Photo'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Permission needed',
        'Please grant camera permission to take photos of your food.',
      );
    });
  });

  it('shows alert when library permission is denied', async () => {
    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({ granted: false });

    const { findByText } = renderWithTheme(
      <NutritionLogModal visible={true} onClose={() => {}} apiKeyExists={true} />,
    );

    fireEvent.press(await findByText('Gallery'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Permission needed',
        'Please grant photo library permission.',
      );
    });
  });

  it('analyzes photo and displays detected foods', async () => {
    ImagePicker.launchCameraAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://photo.jpg' }],
    });
    mockAnalyzeImage.mockResolvedValueOnce({
      detectedFoods: [
        {
          name: 'Pizza',
          calorieEstimate: 300,
          confidence: 0.9,
          portionEstimate: '1 slice',
          macroEstimates: { protein: 12, carbs: 36, fat: 10 },
        },
      ],
    });

    const { findByText } = renderWithTheme(
      <NutritionLogModal visible={true} onClose={() => {}} apiKeyExists={true} />,
    );

    fireEvent.press(await findByText('Take Photo'));

    await waitFor(() => {
      expect(mockAnalyzeImage).toHaveBeenCalledWith('file://photo.jpg');
    });
    await findByText('Pizza');
    await findByText('300 cal');
  });

  it('saves detected foods from AI analysis', async () => {
    ImagePicker.launchCameraAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://photo.jpg' }],
    });
    mockAnalyzeImage.mockResolvedValueOnce({
      detectedFoods: [
        {
          name: 'Salad',
          calorieEstimate: 150,
          confidence: 0.85,
          portionEstimate: '1 bowl',
          macroEstimates: { protein: 5, carbs: 20, fat: 7 },
        },
      ],
    });
    mockCreateMeal.mockResolvedValue(undefined);
    const onClose = jest.fn();

    const { findByText } = renderWithTheme(
      <NutritionLogModal visible={true} onClose={onClose} apiKeyExists={true} date="2026-02-18" />,
    );

    fireEvent.press(await findByText('Take Photo'));
    await waitFor(() => expect(mockAnalyzeImage).toHaveBeenCalled());

    fireEvent.press(await findByText('Save Meal'));

    await waitFor(() => {
      expect(mockCreateMeal).toHaveBeenCalledWith(
        expect.objectContaining({
          date: '2026-02-18',
          totalCalories: 150,
          photoUri: 'file://photo.jpg',
        }),
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Salad',
            calories: 150,
            isAIGenerated: true,
          }),
        ]),
      );
    });
  });

  it('shows error alert when save fails', async () => {
    mockCreateMeal.mockRejectedValueOnce(new Error('DB error'));

    const { findByText, findByPlaceholderText } = renderWithTheme(
      <NutritionLogModal visible={true} onClose={() => {}} apiKeyExists={false} />,
    );

    fireEvent.changeText(await findByPlaceholderText('Food name'), 'Rice');
    fireEvent.changeText(await findByPlaceholderText('Calories'), '200');
    fireEvent.press(await findByText('Save Meal'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Save failed', 'DB error');
    });
  });

  it('calls updateMeal when saving in edit mode', async () => {
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

    const { findByText } = renderWithTheme(
      <NutritionLogModal
        visible={true}
        onClose={onClose}
        apiKeyExists={false}
        editMeal={editMeal}
      />,
    );

    fireEvent.press(await findByText('Update Meal'));

    await waitFor(() => {
      expect(mockUpdateMeal).toHaveBeenCalledWith(
        'meal-1',
        expect.objectContaining({
          mealType: 'breakfast',
          totalCalories: 200,
        }),
      );
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('analyzes gallery photo and displays detected foods', async () => {
    ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://gallery.jpg' }],
    });
    mockAnalyzeImage.mockResolvedValueOnce({
      detectedFoods: [
        {
          name: 'Sushi',
          calorieEstimate: 400,
          confidence: 0.88,
          portionEstimate: '6 pieces',
          macroEstimates: { protein: 20, carbs: 50, fat: 8 },
        },
      ],
    });

    const { findByText } = renderWithTheme(
      <NutritionLogModal visible={true} onClose={() => {}} apiKeyExists={true} />,
    );

    fireEvent.press(await findByText('Gallery'));

    await waitFor(() => {
      expect(mockAnalyzeImage).toHaveBeenCalledWith('file://gallery.jpg');
    });
    await findByText('Sushi');
    await findByText('400 cal');
  });

  it('shows analysis failed alert when gallery AI analysis throws', async () => {
    ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://gallery.jpg' }],
    });
    mockAnalyzeImage.mockRejectedValueOnce(new Error('AI error'));

    const { findByText } = renderWithTheme(
      <NutritionLogModal visible={true} onClose={() => {}} apiKeyExists={true} />,
    );

    fireEvent.press(await findByText('Gallery'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Analysis failed',
        'Could not analyze the food image. You can add items manually.',
      );
    });
  });

  it('switches meal type when pressed', async () => {
    mockCreateMeal.mockResolvedValue(undefined);
    const onClose = jest.fn();

    const { findByText, findByPlaceholderText } = renderWithTheme(
      <NutritionLogModal visible={true} onClose={onClose} apiKeyExists={false} date="2026-02-18" />,
    );

    // Select Dinner
    fireEvent.press(await findByText('Dinner'));

    // Fill manual entry
    fireEvent.changeText(await findByPlaceholderText('Food name'), 'Pasta');
    fireEvent.changeText(await findByPlaceholderText('Calories'), '500');
    fireEvent.press(await findByText('Save Meal'));

    await waitFor(() => {
      expect(mockCreateMeal).toHaveBeenCalledWith(
        expect.objectContaining({
          mealType: 'dinner',
        }),
        expect.anything(),
      );
    });
  });

  it('shows analysis failed alert when AI analysis throws', async () => {
    ImagePicker.launchCameraAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://photo.jpg' }],
    });
    mockAnalyzeImage.mockRejectedValueOnce(new Error('AI error'));

    const { findByText } = renderWithTheme(
      <NutritionLogModal visible={true} onClose={() => {}} apiKeyExists={true} />,
    );

    fireEvent.press(await findByText('Take Photo'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Analysis failed',
        'Could not analyze the food image. You can add items manually.',
      );
    });
  });
});
