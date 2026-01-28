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
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, borderRadius } from '@/src/theme';
import { Card, Button } from '@/src/components/ui';
import { useJournalStore } from '@/src/store';
import { getDateString, getRelativeDateLabel } from '@/src/utils/date';
import { MOOD_LABELS } from '@/src/utils/constants';
import { hasApiKey } from '@/src/services/claude';

export default function JournalScreen() {
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
        } catch (error) {
          Alert.alert('Scan failed', 'Could not read the handwriting. Please try again or type manually.');
        }
      } else {
        Alert.alert('API key needed', 'Add your Claude API key in settings to enable handwriting recognition.');
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
        } catch (error) {
          Alert.alert('Scan failed', 'Could not read the handwriting. Please try again or type manually.');
        }
      } else {
        Alert.alert('API key needed', 'Add your Claude API key in settings to enable handwriting recognition.');
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
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <BookOpen color={colors.journal} size={48} />
            <Text style={styles.emptyText}>No journal entries yet</Text>
            <Text style={styles.emptySubtext}>Start writing or scan a handwritten entry</Text>
          </View>
        ) : (
          entries.map((entry) => (
            <Card key={entry.id} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryDate}>{getRelativeDateLabel(entry.date)}</Text>
                {entry.mood && (
                  <View style={styles.moodBadge}>
                    <Text style={styles.moodText}>{MOOD_LABELS[entry.mood]}</Text>
                  </View>
                )}
              </View>
              {entry.title && <Text style={styles.entryTitle}>{entry.title}</Text>}
              <Text style={styles.entryContent} numberOfLines={3}>
                {entry.content}
              </Text>
              {entry.isScanned && (
                <View style={styles.scannedBadge}>
                  <Camera color={colors.textTertiary} size={12} />
                  <Text style={styles.scannedText}>Scanned</Text>
                </View>
              )}
            </Card>
          ))
        )}
      </ScrollView>

      {/* FABs */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={[styles.fab, styles.fabSecondary]} onPress={() => openModal('scan')}>
          <Camera color={colors.journal} size={20} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.fab} onPress={() => openModal('text')}>
          <Plus color={colors.white} size={24} />
        </TouchableOpacity>
      </View>

      {/* Create Entry Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {mode === 'scan' ? 'Scan Journal' : 'New Entry'}
              </Text>
              <TouchableOpacity onPress={resetModal}>
                <X color={colors.textPrimary} size={24} />
              </TouchableOpacity>
            </View>

            {/* Mode Toggle */}
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.modeOption, mode === 'text' && styles.modeSelected]}
                onPress={() => setMode('text')}
              >
                <Edit3 color={mode === 'text' ? colors.white : colors.textSecondary} size={16} />
                <Text style={[styles.modeText, mode === 'text' && styles.modeTextSelected]}>
                  Type
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeOption, mode === 'scan' && styles.modeSelected]}
                onPress={() => setMode('scan')}
              >
                <Camera color={mode === 'scan' ? colors.white : colors.textSecondary} size={16} />
                <Text style={[styles.modeText, mode === 'scan' && styles.modeTextSelected]}>
                  Scan
                </Text>
              </TouchableOpacity>
            </View>

            {mode === 'scan' && (
              <>
                <View style={styles.cameraRow}>
                  <Button
                    title="Take Photo"
                    variant="secondary"
                    onPress={handleTakePhoto}
                    style={{ flex: 1, marginRight: spacing.sm }}
                  />
                  <Button
                    title="Gallery"
                    variant="secondary"
                    onPress={handlePickImage}
                    style={{ flex: 1 }}
                  />
                </View>

                {isScanning && (
                  <View style={styles.scanningContainer}>
                    <ActivityIndicator color={colors.primary} />
                    <Text style={styles.scanningText}>Reading handwriting...</Text>
                  </View>
                )}

                {scannedImage && (
                  <Image source={{ uri: scannedImage }} style={styles.previewImage} />
                )}
              </>
            )}

            <Text style={styles.inputLabel}>Title (optional)</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Give your entry a title"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={styles.inputLabel}>Content</Text>
            <TextInput
              style={[styles.input, styles.contentInput]}
              value={content}
              onChangeText={setContent}
              placeholder="Write your thoughts..."
              placeholderTextColor={colors.textTertiary}
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.inputLabel}>How are you feeling?</Text>
            <View style={styles.moodRow}>
              {([1, 2, 3, 4, 5] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.moodOption, mood === m && styles.moodOptionSelected]}
                  onPress={() => setMood(mood === m ? null : m)}
                >
                  <Text style={styles.moodEmoji}>{getMoodEmoji(m)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              title="Save Entry"
              onPress={handleSaveEntry}
              loading={isLoading}
              disabled={!content.trim()}
            />
          </View>
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
    backgroundColor: colors.background,
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
    ...typography.h4,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textTertiary,
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
    ...typography.caption,
    color: colors.textSecondary,
  },
  moodBadge: {
    backgroundColor: colors.journal + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  moodText: {
    ...typography.caption,
    color: colors.journal,
    fontWeight: '500',
  },
  entryTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  entryContent: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  scannedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  scannedText: {
    ...typography.caption,
    color: colors.textTertiary,
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
    backgroundColor: colors.journal,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabSecondary: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.journal,
    marginBottom: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
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
    ...typography.h3,
    color: colors.textPrimary,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.gray100,
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
  modeSelected: {
    backgroundColor: colors.journal,
  },
  modeText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  modeTextSelected: {
    color: colors.white,
    fontWeight: '600',
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
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  previewImage: {
    width: '100%',
    height: 120,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
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
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodOptionSelected: {
    backgroundColor: colors.journal + '30',
    borderWidth: 2,
    borderColor: colors.journal,
  },
  moodEmoji: {
    fontSize: 24,
  },
});
