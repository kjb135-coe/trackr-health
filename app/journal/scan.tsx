import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { X, Camera, RotateCcw, Image as ImageIcon, Edit3, FileText } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, borderRadius } from '@/src/theme';
import { AnimatedButton } from '@/src/components/ui';
import { scanHandwrittenJournal, hasApiKey } from '@/src/services/claude';
import { useJournalStore } from '@/src/store';
import { getDateString, getErrorMessage } from '@/src/utils/date';
import { persistImage } from '@/src/utils/imagePersist';

export default function JournalScanScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [transcribedText, setTranscribedText] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [saving, setSaving] = useState(false);
  const { createEntry } = useJournalStore();

  const handleTakePhoto = async () => {
    if (cameraRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const photo = await cameraRef.current.takePictureAsync();
      setCapturedPhoto(photo.uri);
      analyzePhoto(photo.uri);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCapturedPhoto(result.assets[0].uri);
      analyzePhoto(result.assets[0].uri);
    }
  };

  const analyzePhoto = async (imageUri: string) => {
    const hasKey = await hasApiKey();
    if (!hasKey) {
      Alert.alert(
        'API Key Required',
        'Please add your Claude API key in Settings to use handwriting recognition.',
        [
          { text: 'Cancel', onPress: () => setCapturedPhoto(null) },
          { text: 'Go to Settings', onPress: () => router.push('/settings') },
        ],
      );
      return;
    }

    setAnalyzing(true);
    try {
      const result = await scanHandwrittenJournal(imageUri);
      setTranscribedText(result.text);
      setEditedText(result.text);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: unknown) {
      Alert.alert('Transcription Failed', getErrorMessage(error));
      setCapturedPhoto(null);
    }
    setAnalyzing(false);
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setTranscribedText(null);
    setEditedText('');
    setEditMode(false);
  };

  const handleSaveEntry = async () => {
    const textToSave = editMode ? editedText : transcribedText;
    if (!textToSave?.trim()) {
      Alert.alert('Error', 'No text to save');
      return;
    }

    setSaving(true);
    try {
      const persistedUri = capturedPhoto ? await persistImage(capturedPhoto) : undefined;
      await createEntry({
        date: getDateString(),
        title: `Scanned Entry - ${new Date().toLocaleDateString()}`,
        content: textToSave.trim(),
        mood: 3 as 1 | 2 | 3 | 4 | 5,
        tags: ['Scanned'],
        isScanned: true,
        originalImageUri: persistedUri,
        ocrConfidence: 0.85,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error: unknown) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.permissionContainer, { backgroundColor: colors.background }]}>
        <Camera color={colors.textSecondary} size={64} />
        <Text style={[styles.permissionTitle, { color: colors.textPrimary }]}>
          Camera Access Required
        </Text>
        <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
          We need camera access to scan your handwritten journal entries.
        </Text>
        <AnimatedButton title="Grant Permission" onPress={requestPermission} />
        <AnimatedButton
          title="Cancel"
          variant="ghost"
          onPress={() => router.back()}
          style={{ marginTop: spacing.sm }}
        />
      </View>
    );
  }

  if (capturedPhoto) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X color={colors.white} size={24} />
          </TouchableOpacity>
        </View>

        {analyzing ? (
          <View style={[styles.analyzingContainer, { backgroundColor: colors.background }]}>
            <Image source={{ uri: capturedPhoto }} style={styles.previewImageSmall} />
            <View style={styles.analyzingContent}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.analyzingText, { color: colors.textSecondary }]}>
                Reading your handwriting...
              </Text>
            </View>
          </View>
        ) : transcribedText ? (
          <ScrollView style={[styles.resultContainer, { backgroundColor: colors.background }]}>
            <Image source={{ uri: capturedPhoto }} style={styles.resultImage} />

            <Animated.View entering={FadeInDown.duration(400)} style={styles.resultContent}>
              <View style={styles.resultHeader}>
                <FileText color={colors.journal} size={24} />
                <Text style={[styles.resultTitle, { color: colors.textPrimary }]}>
                  Transcribed Text
                </Text>
                <TouchableOpacity onPress={() => setEditMode(!editMode)} style={styles.editButton}>
                  <Edit3 color={editMode ? colors.primary : colors.textSecondary} size={20} />
                </TouchableOpacity>
              </View>

              {editMode ? (
                <TextInput
                  style={[
                    styles.editInput,
                    {
                      backgroundColor: colors.surfaceSecondary,
                      color: colors.textPrimary,
                      borderColor: colors.primary,
                    },
                  ]}
                  value={editedText}
                  onChangeText={setEditedText}
                  multiline
                  textAlignVertical="top"
                  autoFocus
                />
              ) : (
                <Text
                  style={[
                    styles.transcribedText,
                    { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary },
                  ]}
                >
                  {transcribedText}
                </Text>
              )}

              <View style={styles.actionButtons}>
                <AnimatedButton
                  title="Retake"
                  variant="secondary"
                  onPress={handleRetake}
                  style={styles.actionButton}
                />
                <AnimatedButton
                  title="Save Entry"
                  onPress={handleSaveEntry}
                  loading={saving}
                  style={styles.actionButton}
                />
              </View>
            </Animated.View>
          </ScrollView>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X color={colors.white} size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.overlay}>
          <View style={styles.framingGuide}>
            <View style={styles.corner} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.sideButton} onPress={handlePickImage}>
            <ImageIcon color={colors.white} size={28} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.captureButton} onPress={handleTakePhoto}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sideButton}
            onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
          >
            <RotateCcw color={colors.white} size={28} />
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>Position your handwritten page in the frame</Text>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    zIndex: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  framingGuide: {
    width: '85%',
    aspectRatio: 0.7,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#FFFFFF',
    borderTopWidth: 3,
    borderLeftWidth: 3,
    top: 0,
    left: 0,
  },
  cornerTopRight: {
    left: undefined,
    right: 0,
    borderLeftWidth: 0,
    borderRightWidth: 3,
  },
  cornerBottomLeft: {
    top: undefined,
    bottom: 0,
    borderTopWidth: 0,
    borderBottomWidth: 3,
  },
  cornerBottomRight: {
    top: undefined,
    left: undefined,
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
    gap: 40,
  },
  sideButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
  },
  hint: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  analyzingContainer: {
    flex: 1,
  },
  previewImageSmall: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  analyzingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzingText: {
    fontSize: 16,
    marginTop: spacing.md,
  },
  resultContainer: {
    flex: 1,
  },
  resultImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  resultContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  editButton: {
    padding: spacing.xs,
  },
  transcribedText: {
    fontSize: 16,
    lineHeight: 24,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    minHeight: 200,
  },
  editInput: {
    fontSize: 16,
    lineHeight: 24,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    minHeight: 200,
    borderWidth: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  actionButton: {
    flex: 1,
  },
});
