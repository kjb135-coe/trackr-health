import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@/src/theme/ThemeContext';
import OnboardingScreen from '@/app/onboarding';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

const mockSetCompleted = jest.fn();
jest.mock('@/src/store', () => ({
  useOnboardingStore: () => ({
    setCompleted: mockSetCompleted,
  }),
}));

function renderWithTheme() {
  return render(
    <ThemeProvider>
      <OnboardingScreen />
    </ThemeProvider>,
  );
}

describe('OnboardingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSetCompleted.mockResolvedValue(undefined);
  });

  it('renders the first slide title', async () => {
    const { findByText } = renderWithTheme();
    await findByText('Track Your Habits');
  });

  it('renders the first slide description', async () => {
    const { findByText } = renderWithTheme();
    await findByText(/Build positive routines/);
  });

  it('shows Skip button', async () => {
    const { findByText } = renderWithTheme();
    await findByText('Skip');
  });

  it('shows Next button on first slide', async () => {
    const { findByText } = renderWithTheme();
    await findByText('Next');
  });

  it('calls setCompleted and navigates when Skip is pressed', async () => {
    const { findByText } = renderWithTheme();
    fireEvent.press(await findByText('Skip'));

    await waitFor(() => {
      expect(mockSetCompleted).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
    });
  });

  it('renders all 6 slide titles in the FlatList data', async () => {
    const { findByText } = renderWithTheme();
    // First slide should be visible
    await findByText('Track Your Habits');
    // Other slides exist in the data (FlatList renders them)
    await findByText('Sleep Better');
    await findByText('Stay Active');
    await findByText('Smart Nutrition');
    await findByText('Journal Your Journey');
    await findByText('Ready to Start?');
  });
});
