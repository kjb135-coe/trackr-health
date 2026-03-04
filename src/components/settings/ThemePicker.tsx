import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Sun, Moon, Smartphone } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme, type ThemeMode } from '@/src/theme/ThemeContext';
import { spacing, borderRadius } from '@/src/theme';

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'Auto', icon: Smartphone },
];

export function ThemePicker() {
  const { colors, mode, setMode } = useTheme();

  return (
    <View style={styles.themePicker}>
      {THEME_OPTIONS.map((option) => {
        const isSelected = mode === option.value;
        const Icon = option.icon;
        return (
          <Pressable
            key={option.value}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setMode(option.value);
            }}
            style={[
              styles.themeOption,
              {
                backgroundColor: isSelected ? colors.primary : colors.surfaceSecondary,
                borderColor: isSelected ? colors.primary : colors.border,
              },
            ]}
          >
            <Icon size={18} color={isSelected ? colors.white : colors.textSecondary} />
            <Text
              style={[
                styles.themeLabel,
                { color: isSelected ? colors.white : colors.textSecondary },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  themePicker: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.xs,
  },
  themeLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
});
