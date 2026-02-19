import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, Sparkles } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, borderRadius } from '@/src/theme';
import { AnimatedCard, AnimatedButton } from '@/src/components/ui';
import { useHabitStore, useAIInsightsStore } from '@/src/store';
import { HABIT_COLORS } from '@/src/utils/constants';
import { getErrorMessage } from '@/src/utils/date';

interface HabitSuggestionsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function HabitSuggestionsModal({ visible, onClose }: HabitSuggestionsModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { createHabit } = useHabitStore();
  const { habitSuggestions, isLoadingHabits, fetchHabitSuggestions } = useAIInsightsStore();

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.surface,
              paddingBottom: Math.max(spacing.xxl, insets.bottom + spacing.md),
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <View style={styles.headerTitle}>
              <Sparkles color={colors.primary} size={20} />
              <Text
                style={[
                  styles.modalTitleText,
                  { color: colors.textPrimary, marginLeft: spacing.sm },
                ]}
              >
                AI Suggestions
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X color={colors.textPrimary} size={24} />
            </TouchableOpacity>
          </View>

          {isLoadingHabits ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Analyzing your routine...
              </Text>
            </View>
          ) : habitSuggestions.length > 0 ? (
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              {habitSuggestions.map((suggestion, index) => (
                <Animated.View
                  key={suggestion.name}
                  entering={FadeInDown.duration(300).delay(index * 100)}
                >
                  <AnimatedCard style={styles.suggestionCard} delay={index * 50}>
                    <Text style={[styles.suggestionName, { color: colors.textPrimary }]}>
                      {suggestion.name}
                    </Text>
                    <Text style={[styles.suggestionDesc, { color: colors.textSecondary }]}>
                      {suggestion.description}
                    </Text>
                    <Text style={[styles.suggestionReason, { color: colors.primary }]}>
                      💡 {suggestion.reason}
                    </Text>
                    <AnimatedButton
                      title="Add This Habit"
                      variant="secondary"
                      onPress={async () => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        try {
                          await createHabit({
                            name: suggestion.name,
                            description: suggestion.description,
                            color: HABIT_COLORS[index % HABIT_COLORS.length],
                            frequency: suggestion.frequency,
                          });
                          Alert.alert(
                            'Success',
                            `"${suggestion.name}" has been added to your habits!`,
                          );
                        } catch (error) {
                          Alert.alert('Save failed', getErrorMessage(error));
                        }
                      }}
                      style={{ marginTop: spacing.sm }}
                    />
                  </AnimatedCard>
                </Animated.View>
              ))}
            </ScrollView>
          ) : (
            <Text style={[styles.noSuggestions, { color: colors.textSecondary }]}>
              No suggestions available. Try refreshing.
            </Text>
          )}

          <AnimatedButton
            title="Get New Suggestions"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              fetchHabitSuggestions();
            }}
            loading={isLoadingHabits}
            fullWidth
            style={{ marginTop: spacing.md }}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitleText: {
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 14,
  },
  suggestionCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  suggestionDesc: {
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  suggestionReason: {
    fontSize: 13,
    fontWeight: '500',
  },
  noSuggestions: {
    textAlign: 'center',
    padding: spacing.lg,
    fontSize: 14,
  },
});
