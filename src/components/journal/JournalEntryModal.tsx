import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Camera, Edit3 } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, borderRadius } from '@/src/theme';
import { AnimatedButton, ModalHeader } from '@/src/components/ui';
import { useJournalStore } from '@/src/store';
import { getDateString, getErrorMessage } from '@/src/utils/date';
import { JournalEntry } from '@/src/types';

interface JournalEntryModalProps {
  visible: boolean;
  initialMode: 'text' | 'scan';
  onClose: () => void;
  apiKeyExists: boolean;
  editEntry?: JournalEntry;
  date?: string;
}

function getMoodEmoji(mood: number): string {
  switch (mood) {
    case 1:
      return '😢';
    case 2:
      return '😕';
    case 3:
      return '😐';
    case 4:
      return '🙂';
    case 5:
      return '😄';
    default:
      return '😐';
  }
}

export function JournalEntryModal({
  visible,
  initialMode,
  onClose,
  apiKeyExists,
  editEntry,
  date,
}: JournalEntryModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'text' | 'scan'>(initialMode);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [scannedImage, setScannedImage] = useState<string | null>(null);

  const { isLoading, isScanning, createEntry, updateEntry, scanImage } = useJournalStore();

  // Sync mode when modal opens with a different initialMode
  useEffect(() => {
    if (visible) {
      setMode(initialMode);
    }
  }, [visible, initialMode]);

  useEffect(() => {
    if (editEntry) {
      setTitle(editEntry.title || '');
      setContent(editEntry.content);
      setMood((editEntry.mood as 1 | 2 | 3 | 4 | 5) || null);
    }
  }, [editEntry]);

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please grant camera permission to scan your journal.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setScannedImage(result.assets[0].uri);

      if (apiKeyExists) {
        try {
          const ocrResult = await scanImage(result.assets[0].uri);
          setContent(ocrResult.text);
        } catch {
          Alert.alert(
            'Scan failed',
            'Could not read the handwriting. Please try again or type manually.',
          );
        }
      } else {
        Alert.alert(
          'API key needed',
          'Add your Claude API key in settings to enable handwriting recognition.',
        );
      }
    }
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please grant photo library permission.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setScannedImage(result.assets[0].uri);

      if (apiKeyExists) {
        try {
          const ocrResult = await scanImage(result.assets[0].uri);
          setContent(ocrResult.text);
        } catch {
          Alert.alert(
            'Scan failed',
            'Could not read the handwriting. Please try again or type manually.',
          );
        }
      } else {
        Alert.alert(
          'API key needed',
          'Add your Claude API key in settings to enable handwriting recognition.',
        );
      }
    }
  };

  const handleSaveEntry = async () => {
    if (!content.trim()) {
      Alert.alert('Missing content', 'Please write something in your journal entry.');
      return;
    }

    try {
      if (editEntry) {
        await updateEntry(editEntry.id, {
          title: title.trim() || undefined,
          content: content.trim(),
          mood: mood || undefined,
        });
      } else {
        await createEntry({
          date: date || getDateString(),
          title: title.trim() || undefined,
          content: content.trim(),
          mood: mood || undefined,
          isScanned: mode === 'scan' && !!scannedImage,
          originalImageUri: scannedImage || undefined,
        });
      }

      resetAndClose();
    } catch (error) {
      Alert.alert('Save failed', getErrorMessage(error));
    }
  };

  const resetAndClose = () => {
    setMode('text');
    setTitle('');
    setContent('');
    setMood(null);
    setScannedImage(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
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
          <ModalHeader
            title={editEntry ? 'Edit Entry' : mode === 'scan' ? 'Scan Journal' : 'New Entry'}
            onClose={resetAndClose}
          />

          {/* Mode Toggle */}
          <View style={[styles.modeToggle, { backgroundColor: colors.surfaceSecondary }]}>
            <TouchableOpacity
              style={[styles.modeOption, mode === 'text' && { backgroundColor: colors.journal }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMode('text');
              }}
            >
              <Edit3 color={mode === 'text' ? colors.white : colors.textSecondary} size={16} />
              <Text
                style={[
                  styles.modeText,
                  { color: colors.textSecondary },
                  mode === 'text' && { color: colors.white, fontWeight: '600' },
                ]}
              >
                Type
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeOption, mode === 'scan' && { backgroundColor: colors.journal }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMode('scan');
              }}
            >
              <Camera color={mode === 'scan' ? colors.white : colors.textSecondary} size={16} />
              <Text
                style={[
                  styles.modeText,
                  { color: colors.textSecondary },
                  mode === 'scan' && { color: colors.white, fontWeight: '600' },
                ]}
              >
                Scan
              </Text>
            </TouchableOpacity>
          </View>

          {mode === 'scan' && (
            <>
              <View style={styles.cameraRow}>
                <AnimatedButton
                  title="Take Photo"
                  variant="secondary"
                  onPress={handleTakePhoto}
                  style={{ flex: 1, marginRight: spacing.sm }}
                />
                <AnimatedButton
                  title="Gallery"
                  variant="secondary"
                  onPress={handlePickImage}
                  style={{ flex: 1 }}
                />
              </View>

              {isScanning && (
                <View style={styles.scanningContainer}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={[styles.scanningText, { color: colors.textSecondary }]}>
                    Reading handwriting...
                  </Text>
                </View>
              )}

              {scannedImage && <Image source={{ uri: scannedImage }} style={styles.previewImage} />}
            </>
          )}

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Title (optional)</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary },
            ]}
            value={title}
            onChangeText={setTitle}
            placeholder="Give your entry a title"
            placeholderTextColor={colors.textTertiary}
          />

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Content</Text>
          <TextInput
            style={[
              styles.input,
              styles.contentInput,
              { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary },
            ]}
            value={content}
            onChangeText={setContent}
            placeholder="Write your thoughts..."
            placeholderTextColor={colors.textTertiary}
            multiline
            textAlignVertical="top"
          />

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            How are you feeling?
          </Text>
          <View style={styles.moodRow}>
            {([1, 2, 3, 4, 5] as const).map((m) => (
              <TouchableOpacity
                key={m}
                style={[
                  styles.moodOption,
                  { backgroundColor: colors.surfaceSecondary },
                  mood === m && {
                    backgroundColor: colors.journal + '30',
                    borderWidth: 2,
                    borderColor: colors.journal,
                  },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setMood(mood === m ? null : m);
                }}
              >
                <Text style={styles.moodEmoji}>{getMoodEmoji(m)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <AnimatedButton
            title={editEntry ? 'Update Entry' : 'Save Entry'}
            onPress={handleSaveEntry}
            loading={isLoading}
            disabled={!content.trim()}
            fullWidth
          />
        </Animated.View>
      </KeyboardAvoidingView>
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
    maxHeight: '90%',
  },
  modeToggle: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    padding: 4,
    marginBottom: spacing.lg,
  },
  modeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md - 2,
  },
  modeText: {
    fontSize: 14,
    marginLeft: spacing.xs,
  },
  cameraRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  scanningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  scanningText: {
    fontSize: 16,
    marginLeft: spacing.sm,
  },
  previewImage: {
    width: '100%',
    height: 120,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  input: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    marginBottom: spacing.md,
  },
  contentInput: {
    height: 120,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  moodOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodEmoji: {
    fontSize: 24,
  },
});
