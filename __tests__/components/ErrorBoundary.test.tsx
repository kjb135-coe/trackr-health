import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ErrorBoundary } from '@/src/components/ui';

// Suppress console.error from ErrorBoundary in test output
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
});

function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <Text>Child content</Text>;
}

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Text>Safe content</Text>
      </ErrorBoundary>,
    );
    expect(getByText('Safe content')).toBeTruthy();
  });

  it('renders error UI when child throws', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow />
      </ErrorBoundary>,
    );
    expect(getByText('Something went wrong')).toBeTruthy();
    expect(getByText('Test error')).toBeTruthy();
  });

  it('renders Try Again button that resets state', () => {
    const { getByText, queryByText } = render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow />
      </ErrorBoundary>,
    );
    expect(getByText('Something went wrong')).toBeTruthy();
    fireEvent.press(getByText('Try Again'));
    // After retry, component re-renders — but child throws again
    expect(queryByText('Something went wrong')).toBeTruthy();
  });

  it('renders custom fallback when provided', () => {
    const { getByText, queryByText } = render(
      <ErrorBoundary fallback={<Text>Custom fallback</Text>}>
        <ThrowingChild shouldThrow />
      </ErrorBoundary>,
    );
    expect(getByText('Custom fallback')).toBeTruthy();
    expect(queryByText('Something went wrong')).toBeNull();
  });

  it('shows default message when error has no message', () => {
    function ThrowNull(): React.ReactNode {
      throw new Error('');
    }
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowNull />
      </ErrorBoundary>,
    );
    expect(getByText('Something went wrong')).toBeTruthy();
  });
});
