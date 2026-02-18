import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Plus, Camera, X, BookOpen, Edit3 } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, borderRadius } from '@/src/theme';
import { AnimatedCard, AnimatedButton } from '@/src/components/ui';
import { useJournalStore } from '@/src/store';
import { getDateString, getRelativeDateLabel } from '@/src/utils/date';
import { MOOD_LABELS } from '@/src/utils/constants';
import { hasApiKey } from '@/src/services/claude';

export default function JournalScreen() {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [mode, setMode] = useState<'text' | 'scan'>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [apiKeyExists, setApiKeyExists] = useState(false);

  const { entries, isLoading, isScanning, loadEntries, createEntry, scanImage } = useJournalStore();

  useEffect(() => {
    loadEntries();
    checkApiKey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkApiKey = async () => {
    const exists = await hasApiKey();
    setApiKeyExists(exists);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEntries();
    setRefreshing(false);
  };

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

    await createEntry({
      date: getDateString(),
      title: title.trim() || undefined,
      content: content.trim(),
      mood: mood || undefined,
      isScanned: mode === 'scan' && !!scannedImage,
      originalImageUri: scannedImage || undefined,
    });

    resetModal();
  };

  const resetModal = () => {
    setModalVisible(false);
    setMode('text');
    setTitle('');
    setContent('');
    setMood(null);
    setScannedImage(null);
  };

  const openModal = (initialMode: 'text' | 'scan') => {
    setMode(initialMode);
    setModalVisible(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <BookOpen color={colors.journal} size={48} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No journal entries yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
              Start writing or scan a handwritten entry
            </Text>
          </View>
        ) : (
          entries.map((entry, index) => (
            <Animated.View key={entry.id} entering={FadeInDown.duration(400).delay(index * 50)}>
              <AnimatedCard style={styles.entryCard} delay={index * 50}>
                <View style={styles.entryHeader}>
                  <Text style={[styles.entryDate, { color: colors.textSecondary }]}>
                    {getRelativeDateLabel(entry.date)}
                  </Text>
                  {entry.mood && (
                    <View style={[styles.moodBadge, { backgroundColor: colors.journal + '20' }]}>
                      <Text style={[styles.moodText, { color: colors.journal }]}>
                        {MOOD_LABELS[entry.mood]}
                      </Text>
                    </View>
                  )}
                </View>
                {entry.title && (
                  <Text style={[styles.entryTitle, { color: colors.textPrimary }]}>
                    {entry.title}
                  </Text>
                )}
                <Text
                  style={[styles.entryContent, { color: colors.textSecondary }]}
                  numberOfLines={3}
                >
                  {entry.content}
                </Text>
                {entry.isScanned && (
                  <View style={styles.scannedBadge}>
                    <Camera color={colors.textTertiary} size={12} />
                    <Text style={[styles.scannedText, { color: colors.textTertiary }]}>
                      Scanned
                    </Text>
                  </View>
                )}
              </AnimatedCard>
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* FABs */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[
            styles.fab,
            styles.fabSecondary,
            { backgroundColor: colors.surface, borderColor: colors.journal },
          ]}
          onPress={() => openModal('scan')}
        >
          <Camera color={colors.journal} size={20} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.journal }]}
          onPress={() => openModal('text')}
        >
          <Plus color="#FFFFFF" size={24} />
        </TouchableOpacity>
      </View>

      {/* Create Entry Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Animated.View
            entering={FadeInDown.duration(300)}
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {mode === 'scan' ? 'Scan Journal' : 'New Entry'}
              </Text>
              <TouchableOpacity onPress={resetModal}>
                <X color={colors.textPrimary} size={24} />
              </TouchableOpacity>
            </View>

            {/* Mode Toggle */}
            <View style={[styles.modeToggle, { backgroundColor: colors.surfaceSecondary }]}>
              <TouchableOpacity
                style={[styles.modeOption, mode === 'text' && { backgroundColor: colors.journal }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setMode('text');
                }}
              >
                <Edit3 color={mode === 'text' ? '#FFFFFF' : colors.textSecondary} size={16} />
                <Text
                  style={[
                    styles.modeText,
                    { color: colors.textSecondary },
                    mode === 'text' && { color: '#FFFFFF', fontWeight: '600' },
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
                <Camera color={mode === 'scan' ? '#FFFFFF' : colors.textSecondary} size={16} />
                <Text
                  style={[
                    styles.modeText,
                    { color: colors.textSecondary },
                    mode === 'scan' && { color: '#FFFFFF', fontWeight: '600' },
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

                {scannedImage && (
                  <Image source={{ uri: scannedImage }} style={styles.previewImage} />
                )}
              </>
            )}

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Title (optional)
            </Text>
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
              title="Save Entry"
              onPress={handleSaveEntry}
              loading={isLoading}
              disabled={!content.trim()}
              fullWidth
            />
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  entryCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  entryDate: {
    fontSize: 12,
  },
  moodBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  moodText: {
    fontSize: 12,
    fontWeight: '500',
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  entryContent: {
    fontSize: 14,
    lineHeight: 22,
  },
  scannedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  scannedText: {
    fontSize: 12,
    marginLeft: 4,
  },
  fabContainer: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    alignItems: 'center',
  },
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
  fabSecondary: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    marginBottom: spacing.sm,
  },
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
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
