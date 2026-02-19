import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '@/src/theme/ThemeContext';
import { Input } from '@/src/components/ui/Input';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('Input', () => {
  it('renders with placeholder', async () => {
    const { findByPlaceholderText } = renderWithTheme(<Input placeholder="Enter text" />);
    await findByPlaceholderText('Enter text');
  });

  it('renders label when provided', async () => {
    const { findByText } = renderWithTheme(<Input label="Email" placeholder="email@example.com" />);
    await findByText('Email');
  });

  it('renders error message when provided', async () => {
    const { findByText } = renderWithTheme(<Input error="This field is required" />);
    await findByText('This field is required');
  });

  it('does not render label when not provided', async () => {
    const { findByPlaceholderText, queryByText } = renderWithTheme(
      <Input placeholder="No label" />,
    );
    await findByPlaceholderText('No label');
    expect(queryByText('Email')).toBeNull();
  });

  it('calls onChangeText when text changes', async () => {
    const onChangeText = jest.fn();
    const { findByPlaceholderText } = renderWithTheme(
      <Input placeholder="Type here" onChangeText={onChangeText} />,
    );

    const input = await findByPlaceholderText('Type here');
    fireEvent.changeText(input, 'hello');
    expect(onChangeText).toHaveBeenCalledWith('hello');
  });
});
