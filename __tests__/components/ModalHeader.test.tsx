import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '@/src/theme/ThemeContext';
import { ModalHeader } from '@/src/components/ui';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('ModalHeader', () => {
  it('renders the title', async () => {
    const { findByText } = renderWithTheme(<ModalHeader title="Log Sleep" onClose={() => {}} />);
    await findByText('Log Sleep');
  });

  it('calls onClose when close button is pressed', async () => {
    const onClose = jest.fn();
    const { findByTestId } = renderWithTheme(<ModalHeader title="Edit Habit" onClose={onClose} />);

    fireEvent.press(await findByTestId('modal-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
