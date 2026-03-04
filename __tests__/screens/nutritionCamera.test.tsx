import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import NutritionCameraScreen from '@/app/nutrition/camera';

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

const mockCreateMeal = jest.fn();
jest.mock('@/src/store', () => ({
  useNutritionStore: () => ({
    createMeal: mockCreateMeal,
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

const mockAnalyzeFoodImage = jest.fn();
const mockHasApiKey = jest.fn();
jest.mock('@/src/services/claude', () => ({
  analyzeFoodImage: (...args: unknown[]) => mockAnalyzeFoodImage(...args),
  hasApiKey: () => mockHasApiKey(),
}));

jest.mock('@/src/utils/imagePersist', () => ({
  persistImage: jest.fn().mockResolvedValue('/persisted/image.jpg'),
}));

jest.mock('lucide-react-native', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  return {
    X: (props: Record<string, unknown>) => <View testID="x-icon" {...props} />,
    Camera: (props: Record<string, unknown>) => <View testID="camera-icon" {...props} />,
    RotateCcw: (props: Record<string, unknown>) => <View testID="rotate-icon" {...props} />,
    Image: (props: Record<string, unknown>) => <View testID="image-icon" {...props} />,
    Utensils: (props: Record<string, unknown>) => <View testID="utensils-icon" {...props} />,
  };
});

const MOCK_ANALYSIS = {
  detectedFoods: [
    {
      name: 'Grilled Chicken',
      calorieEstimate: 300,
      portionEstimate: '1 breast',
      confidence: 0.9,
      macroEstimates: { protein: 40, carbs: 0, fat: 8 },
    },
    {
      name: 'Rice',
      calorieEstimate: 200,
      portionEstimate: '1 cup',
      confidence: 0.85,
      macroEstimates: { protein: 4, carbs: 45, fat: 1 },
    },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockPermission = { granted: true };
  mockHasApiKey.mockResolvedValue(true);
});

describe('NutritionCameraScreen', () => {
  it('renders empty container when permission is null (loading)', () => {
    mockPermission = null;
    const { queryByText } = render(<NutritionCameraScreen />);
    expect(queryByText('Camera Access Required')).toBeNull();
    expect(queryByText('Take a photo of your food')).toBeNull();
  });

  it('renders permission request when not granted', () => {
    mockPermission = { granted: false };
    const { getByText } = render(<NutritionCameraScreen />);
    expect(getByText('Camera Access Required')).toBeTruthy();
    expect(getByText('Grant Permission')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
  });

  it('calls requestPermission when Grant Permission is pressed', () => {
    mockPermission = { granted: false };
    const { getByText } = render(<NutritionCameraScreen />);
    fireEvent.press(getByText('Grant Permission'));
    expect(mockRequestPermission).toHaveBeenCalled();
  });

  it('navigates back when Cancel is pressed on permission screen', () => {
    mockPermission = { granted: false };
    const { getByText } = render(<NutritionCameraScreen />);
    fireEvent.press(getByText('Cancel'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('renders camera view with hint text when permission granted', () => {
    const { getByText, getByTestId } = render(<NutritionCameraScreen />);
    expect(getByTestId('camera-view')).toBeTruthy();
    expect(getByText('Take a photo of your food')).toBeTruthy();
  });

  it('shows analyzing state when photo is picked from gallery', async () => {
    mockLaunchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///photo.jpg' }],
    });
    mockAnalyzeFoodImage.mockImplementation(
      () => new Promise(() => {}), // never resolves — stays in analyzing
    );

    const { getByTestId, findByText } = render(<NutritionCameraScreen />);
    fireEvent.press(getByTestId('image-icon'));

    await findByText('Analyzing your food...');
  });

  it('shows results card after successful analysis', async () => {
    mockLaunchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///photo.jpg' }],
    });
    mockAnalyzeFoodImage.mockResolvedValueOnce(MOCK_ANALYSIS);

    const { getByTestId, findByText } = render(<NutritionCameraScreen />);
    fireEvent.press(getByTestId('image-icon'));

    await findByText('Food Detected');
    await findByText('Grilled Chicken');
    await findByText('Rice');
    await findByText('500'); // total calories (300+200)
    await findByText('calories');
  });

  it('shows macro breakdown in results', async () => {
    mockLaunchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///photo.jpg' }],
    });
    mockAnalyzeFoodImage.mockResolvedValueOnce(MOCK_ANALYSIS);

    const { getByTestId, findByText } = render(<NutritionCameraScreen />);
    fireEvent.press(getByTestId('image-icon'));

    await findByText('44g'); // protein (40+4)
    await findByText('Protein');
    await findByText('45g'); // carbs (0+45)
    await findByText('Carbs');
    await findByText('9g'); // fat (8+1)
    await findByText('Fat');
  });

  it('shows meal type selector with 4 options', async () => {
    mockLaunchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///photo.jpg' }],
    });
    mockAnalyzeFoodImage.mockResolvedValueOnce(MOCK_ANALYSIS);

    const { getByTestId, findByText } = render(<NutritionCameraScreen />);
    fireEvent.press(getByTestId('image-icon'));

    await findByText('Breakfast');
    await findByText('Lunch');
    await findByText('Dinner');
    await findByText('Snack');
  });

  it('saves meal and navigates back on success', async () => {
    mockLaunchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///photo.jpg' }],
    });
    mockAnalyzeFoodImage.mockResolvedValueOnce(MOCK_ANALYSIS);
    mockCreateMeal.mockResolvedValueOnce(undefined);

    const { getByTestId, findByText } = render(<NutritionCameraScreen />);
    fireEvent.press(getByTestId('image-icon'));

    const saveButton = await findByText('Save Meal');
    fireEvent.press(saveButton);

    await waitFor(
      () => {
        expect(mockCreateMeal).toHaveBeenCalledWith(
          expect.objectContaining({
            mealType: 'lunch',
            name: 'Grilled Chicken, Rice',
            totalCalories: 500,
          }),
          expect.arrayContaining([
            expect.objectContaining({ name: 'Grilled Chicken', calories: 300 }),
            expect.objectContaining({ name: 'Rice', calories: 200 }),
          ]),
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
      assets: [{ uri: 'file:///photo.jpg' }],
    });
    mockAnalyzeFoodImage.mockResolvedValueOnce(MOCK_ANALYSIS);
    mockCreateMeal.mockRejectedValueOnce(new Error('Save failed'));

    const { getByTestId, findByText } = render(<NutritionCameraScreen />);
    fireEvent.press(getByTestId('image-icon'));

    const saveButton = await findByText('Save Meal');
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
      assets: [{ uri: 'file:///photo.jpg' }],
    });

    const { getByTestId } = render(<NutritionCameraScreen />);
    fireEvent.press(getByTestId('image-icon'));

    await waitFor(
      () => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'API Key Required',
          'Please add your Claude API key in Settings to use AI food recognition.',
          expect.any(Array),
        );
      },
      { timeout: 5000 },
    );
  });

  it('shows error alert when analysis fails', async () => {
    jest.spyOn(Alert, 'alert');
    mockLaunchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///photo.jpg' }],
    });
    mockAnalyzeFoodImage.mockRejectedValueOnce(new Error('Network error'));

    const { getByTestId } = render(<NutritionCameraScreen />);
    fireEvent.press(getByTestId('image-icon'));

    await waitFor(
      () => {
        expect(Alert.alert).toHaveBeenCalledWith('Analysis Failed', 'Network error');
      },
      { timeout: 5000 },
    );
  });

  it('does nothing when gallery picker is canceled', async () => {
    mockLaunchImageLibraryAsync.mockResolvedValueOnce({ canceled: true });

    const { getByTestId, queryByText } = render(<NutritionCameraScreen />);
    fireEvent.press(getByTestId('image-icon'));

    await waitFor(
      () => {
        expect(mockLaunchImageLibraryAsync).toHaveBeenCalled();
      },
      { timeout: 5000 },
    );
    expect(queryByText('Analyzing your food...')).toBeNull();
  });
});
