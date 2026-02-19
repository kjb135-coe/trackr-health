import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { X, Smile, Meh, Frown, Camera } from 'lucide-react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, borderRadius } from '@/src/theme';
import { AnimatedButton } from '@/src/components/ui';
import { useJournalStore } from '@/src/store';
import { getDateString, getErrorMessage } from '@/src/utils/date';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const QUICK_TAGS = [
  'Work',
  'Health',
  'Family',
  'Friends',
  'Exercise',
  'Travel',
  'Learning',
  'Creativity',
  'Gratitude',
  'Goals',
  'Reflection',
  'Ideas',
];

function TagChip({
  label,
  selected,
  onPress,
  color,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  color: string;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={() => {
        scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
        setTimeout(() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 400 });
        }, 100);
        onPress();
      }}
      style={[
        styles.tag,
        animatedStyle,
        { backgroundColor: selected ? color + '20' : colors.surfaceSecondary },
      ]}
    >
      <Text
        style={[
          styles.tagText,
          { color: selected ? color : colors.textSecondary, fontWeight: selected ? '600' : '400' },
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

export default function NewJournalEntryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { createEntry } = useJournalStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState(3);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const MOOD_OPTIONS = [
    { value: 1, label: 'Terrible', Icon: Frown, color: colors.error },
    { value: 2, label: 'Bad', Icon: Frown, color: colors.warning },
    { value: 3, label: 'Okay', Icon: Meh, color: colors.textTertiary },
    { value: 4, label: 'Good', Icon: Smile, color: colors.info },
    { value: 5, label: 'Great', Icon: Smile, color: colors.success },
  ];

  const toggleTag = (tag: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please write something in your journal entry');
      return;
    }

    setSaving(true);
    try {
      await createEntry({
        date: getDateString(),
        title: title.trim() || `Journal Entry - ${new Date().toLocaleDateString()}`,
        content: content.trim(),
        mood: mood as 1 | 2 | 3 | 4 | 5,
        tags: selectedTags,
        isScanned: false,
        originalImageUri: undefined,
        ocrConfidence: undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error: unknown) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleScanInstead = () => {
    router.replace('/journal/scan');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X color={colors.textSecondary} size={24} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>New Entry</Text>
        <TouchableOpacity onPress={handleScanInstead} style={styles.scanButton}>
          <Camera color={colors.primary} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <TextInput
            style={[styles.titleInput, { color: colors.textPrimary }]}
            value={title}
            onChangeText={setTitle}
            placeholder="Title (optional)"
            placeholderTextColor={colors.textTertiary}
          />
        </Animated.View>

        {/* Content */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)}>
          <TextInput
            style={[styles.contentInput, { color: colors.textPrimary }]}
            value={content}
            onChangeText={setContent}
            placeholder="What's on your mind today?"
            placeholderTextColor={colors.textTertiary}
            multiline
            textAlignVertical="top"
            autoFocus
          />
        </Animated.View>

        {/* Mood Selector */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            How are you feeling?
          </Text>
          <View style={styles.moodContainer}>
            {MOOD_OPTIONS.map((option) => {
              const Icon = option.Icon;
              const isSelected = mood === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.moodOption,
                    isSelected && { backgroundColor: option.color + '20' },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setMood(option.value);
                  }}
                >
                  <Icon
                    color={isSelected ? option.color : colors.textTertiary}
                    fill={isSelected ? option.color : 'none'}
                    size={32}
                  />
                  <Text
                    style={[
                      styles.moodLabel,
                      { color: colors.textTertiary },
                      isSelected && { color: option.color },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* Tags */}
        <Animated.View entering={FadeInDown.duration(400).delay(250)}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Tags</Text>
          <View style={styles.tagsContainer}>
            {QUICK_TAGS.map((tag) => (
              <TagChip
                key={tag}
                label={tag}
                selected={selectedTags.includes(tag)}
                onPress={() => toggleTag(tag)}
                color={colors.journal}
              />
            ))}
          </View>
        </Animated.View>

        {/* Save Button */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)}>
          <AnimatedButton
            title="Save Entry"
            onPress={handleSave}
            loading={saving}
            style={styles.saveButton}
            fullWidth
          />
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: spacing.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  scanButton: {
    padding: spacing.xs,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.md,
    padding: 0,
  },
  contentInput: {
    fontSize: 16,
    minHeight: 200,
    marginBottom: spacing.lg,
    padding: 0,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodOption: {
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    flex: 1,
  },
  moodLabel: {
    fontSize: 11,
    marginTop: spacing.xs,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  tagText: {
    fontSize: 14,
  },
  saveButton: {
    marginTop: spacing.xl,
  },
});
