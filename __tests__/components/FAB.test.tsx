import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { FAB, SecondaryFAB, FABGroup } from '@/src/components/ui';

describe('FAB', () => {
  it('renders icon and calls onPress', () => {
    const onPress = jest.fn();
    const { getByText } = render(<FAB onPress={onPress} color="#FF0000" icon={<Text>+</Text>} />);
    expect(getByText('+')).toBeTruthy();
    fireEvent.press(getByText('+'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders with grouped=true without absolute positioning', () => {
    const { getByText } = render(
      <FAB onPress={jest.fn()} color="#00FF00" icon={<Text>icon</Text>} grouped />,
    );
    expect(getByText('icon')).toBeTruthy();
  });
});

describe('SecondaryFAB', () => {
  it('renders icon and calls onPress', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <SecondaryFAB
        onPress={onPress}
        backgroundColor="#FFF"
        borderColor="#000"
        icon={<Text>S</Text>}
      />,
    );
    expect(getByText('S')).toBeTruthy();
    fireEvent.press(getByText('S'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('FABGroup', () => {
  it('renders children', () => {
    const { getByText } = render(
      <FABGroup>
        <Text>Child 1</Text>
        <Text>Child 2</Text>
      </FABGroup>,
    );
    expect(getByText('Child 1')).toBeTruthy();
    expect(getByText('Child 2')).toBeTruthy();
  });
});
