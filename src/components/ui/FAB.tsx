import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { spacing } from '@/src/theme';

interface FABProps {
  onPress: () => void;
  color: string;
  icon: React.ReactNode;
  /** Set to true when FAB is inside a FABGroup (disables absolute positioning) */
  grouped?: boolean;
}

interface SecondaryFABProps {
  onPress: () => void;
  backgroundColor: string;
  borderColor: string;
  icon: React.ReactNode;
}

interface FABGroupProps {
  children: React.ReactNode;
}

export function FAB({ onPress, color, icon, grouped }: FABProps) {
  return (
    <TouchableOpacity
      style={[styles.fab, !grouped && styles.positioned, { backgroundColor: color }]}
      onPress={onPress}
    >
      {icon}
    </TouchableOpacity>
  );
}

export function SecondaryFAB({ onPress, backgroundColor, borderColor, icon }: SecondaryFABProps) {
  return (
    <TouchableOpacity
      style={[styles.fab, styles.secondary, { backgroundColor, borderColor }]}
      onPress={onPress}
    >
      {icon}
    </TouchableOpacity>
  );
}

export function FABGroup({ children }: FABGroupProps) {
  return <View style={styles.group}>{children}</View>;
}

const styles = StyleSheet.create({
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  positioned: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
  },
  secondary: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    marginBottom: spacing.sm,
  },
  group: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    alignItems: 'center',
  },
});
