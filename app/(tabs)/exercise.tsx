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
} from 'react-native';
import { Plus, Dumbbell, X } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '@/src/theme';
import { Card, Button } from '@/src/components/ui';
import { useExerciseStore } from '@/src/store';
import { getDateString, formatDuration, getRelativeDateLabel } from '@/src/utils/date';
import { EXERCISE_TYPE_LABELS, INTENSITY_LABELS } from '@/src/utils/constants';
import { ExerciseType, ExerciseIntensity } from '@/src/types';

const EXERCISE_TYPES: ExerciseType[] = [
  'running',
  'walking',
  'cycling',
  'swimming',
  'weight_training',
  'yoga',
  'hiit',
  'cardio',
];

const INTENSITIES: ExerciseIntensity[] = ['low', 'moderate', 'high', 'very_high'];

export default function ExerciseScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<ExerciseType>('running');
  const [duration, setDuration] = useState('30');
  const [intensity, setIntensity] = useState<ExerciseIntensity>('moderate');
  const [calories, setCalories] = useState('');

  const { sessions, isLoading, loadSessions, createSession } = useExerciseStore();

  useEffect(() => {
    loadSessions();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  };

  const handleCreateSession = async () => {
    const durationMinutes = parseInt(duration) || 0;
    if (durationMinutes <= 0) return;

    await createSession({
      date: getDateString(),
      type: selectedType,
      durationMinutes,
      intensity,
      caloriesBurned: calories ? parseInt(calories) : undefined,
    });

    setDuration('30');
    setCalories('');
    setModalVisible(false);
  };

  const recentSessions = sessions.slice(0, 10);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.sectionTitle}>Recent Workouts</Text>

        {recentSessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Dumbbell color={colors.exercise} size={48} />
            <Text style={styles.emptyText}>No workouts yet</Text>
            <Text style={styles.emptySubtext}>Tap + to log your exercise</Text>
          </View>
        ) : (
          recentSessions.map((session) => (
            <Card key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <Text style={styles.sessionType}>
                  {EXERCISE_TYPE_LABELS[session.type] || session.type}
                </Text>
                <Text style={styles.sessionDate}>{getRelativeDateLabel(session.date)}</Text>
              </View>

              <View style={styles.sessionStats}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{formatDuration(session.durationMinutes)}</Text>
                  <Text style={styles.statLabel}>Duration</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{INTENSITY_LABELS[session.intensity]}</Text>
                  <Text style={styles.statLabel}>Intensity</Text>
                </View>
                {session.caloriesBurned && (
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{session.caloriesBurned}</Text>
                    <Text style={styles.statLabel}>Calories</Text>
                  </View>
                )}
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Plus color={colors.white} size={24} />
      </TouchableOpacity>

      {/* Log Exercise Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Exercise</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={colors.textPrimary} size={24} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Exercise Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
              {EXERCISE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeOption,
                    selectedType === type && styles.typeSelected,
                  ]}
                  onPress={() => setSelectedType(type)}
                >
                  <Text
                    style={[
                      styles.typeText,
                      selectedType === type && styles.typeTextSelected,
                    ]}
                  >
                    {EXERCISE_TYPE_LABELS[type]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Duration (minutes)</Text>
            <TextInput
              style={styles.input}
              value={duration}
              onChangeText={setDuration}
              keyboardType="number-pad"
              placeholder="30"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={styles.inputLabel}>Intensity</Text>
            <View style={styles.intensityRow}>
              {INTENSITIES.map((int) => (
                <TouchableOpacity
                  key={int}
                  style={[
                    styles.intensityOption,
                    intensity === int && styles.intensitySelected,
                  ]}
                  onPress={() => setIntensity(int)}
                >
                  <Text
                    style={[
                      styles.intensityText,
                      intensity === int && styles.intensityTextSelected,
                    ]}
                  >
                    {INTENSITY_LABELS[int]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Calories Burned (optional)</Text>
            <TextInput
              style={styles.input}
              value={calories}
              onChangeText={setCalories}
              keyboardType="number-pad"
              placeholder="200"
              placeholderTextColor={colors.textTertiary}
            />

            <Button title="Save Workout" onPress={handleCreateSession} />
          </View>
        </View>
      </Modal>
    </View>
  );
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
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
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
  },
  sessionCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sessionType: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  sessionDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h4,
    color: colors.exercise,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.exercise,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
    maxHeight: '80%',
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
    marginBottom: spacing.lg,
  },
  typeScroll: {
    marginBottom: spacing.lg,
  },
  typeOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
  },
  typeSelected: {
    backgroundColor: colors.exercise,
  },
  typeText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  typeTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  intensityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  intensityOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  intensitySelected: {
    backgroundColor: colors.exercise,
  },
  intensityText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  intensityTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
});
