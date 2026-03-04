import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import {
  User,
  Key,
  Bell,
  Moon,
  LogOut,
  ChevronRight,
  Shield,
  Trash2,
  Star,
  Share2,
  Mail,
  Target,
  Download,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, borderRadius } from '@/src/theme';
import { AnimatedButton } from '@/src/components/ui';
import { SettingRow, ThemePicker } from '@/src/components/settings';
import { useAuthStore } from '@/src/store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { hasApiKey, setApiKey, deleteApiKey } from '@/src/services/claude';
import { shareExportedData, shareCSVExport } from '@/src/services/export';
import { APP_LINKS, STORAGE_KEYS } from '@/src/utils/constants';
import {
  requestNotificationPermissions,
  cancelAllHabitReminders,
  scheduleHabitReminder,
} from '@/src/services/notifications';
import { habitRepository } from '@/src/database/repositories';
import { getDatabase } from '@/src/database';
import { getErrorMessage } from '@/src/utils/date';
import { clearAllImages } from '@/src/utils/imagePersist';
import { confirmDelete } from '@/src/utils/alerts';
import { ANIMATION_DURATION, STAGGER_DELAY } from '@/src/utils/animations';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user, signOut } = useAuthStore();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [showApiInput, setShowApiInput] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    checkApiKey();
    loadNotificationPref();
  }, []);

  const loadNotificationPref = async () => {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED);
      if (value !== null) {
        setNotificationsEnabled(value === 'true');
      }
    } catch {
      // Silent fail — use default
    }
  };

  const checkApiKey = async () => {
    const exists = await hasApiKey();
    setHasKey(exists);
  };

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) {
      Alert.alert('Error', 'Please enter an API key');
      return;
    }

    try {
      await setApiKey(apiKeyInput.trim());
      setHasKey(true);
      setShowApiInput(false);
      setApiKeyInput('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'API key saved successfully');
    } catch (error: unknown) {
      Alert.alert('Error', getErrorMessage(error));
    }
  };

  const handleDeleteApiKey = () => {
    confirmDelete(
      'Remove API Key',
      'Are you sure you want to remove your Claude API key? AI features will be disabled.',
      async () => {
        await deleteApiKey();
        setHasKey(false);
      },
      'Remove',
    );
  };

  const handleSignOut = () => {
    confirmDelete(
      'Sign Out',
      'Are you sure you want to sign out?',
      async () => {
        await signOut();
        router.replace('/auth/login');
      },
      'Sign Out',
    );
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          'Permissions Required',
          'Please enable notifications in your device settings to receive habit reminders.',
        );
        return;
      }
      const habits = await habitRepository.getAll();
      for (const habit of habits) {
        if (habit.reminderTime) {
          try {
            await scheduleHabitReminder(habit);
          } catch {
            // Continue scheduling remaining habits
          }
        }
      }
    } else {
      await cancelAllHabitReminders();
    }
    setNotificationsEnabled(enabled);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED, String(enabled));
    } catch {
      // Silent fail — toggle applied but not persisted
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleExportData = async () => {
    try {
      await shareExportedData();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: unknown) {
      Alert.alert('Export Failed', getErrorMessage(error));
    }
  };

  const handleExportCSV = () => {
    Alert.alert('Export CSV', 'Choose which data to export', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Habits', onPress: () => exportCSV('habits') },
      { text: 'Sleep', onPress: () => exportCSV('sleep') },
      { text: 'Exercise', onPress: () => exportCSV('exercise') },
      { text: 'Nutrition', onPress: () => exportCSV('nutrition') },
    ]);
  };

  const exportCSV = async (type: 'habits' | 'sleep' | 'exercise' | 'nutrition' | 'journal') => {
    try {
      await shareCSVExport(type);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: unknown) {
      Alert.alert('Export Failed', getErrorMessage(error));
    }
  };

  const handleClearData = () => {
    confirmDelete(
      'Clear All Data',
      'This will permanently delete all your health data. This action cannot be undone.',
      async () => {
        try {
          const db = await getDatabase();
          await db.execAsync(`
                DELETE FROM habit_completions;
                DELETE FROM habits;
                DELETE FROM sleep_entries;
                DELETE FROM exercise_sessions;
                DELETE FROM food_items;
                DELETE FROM meals;
                DELETE FROM journal_entries;
              `);
          await clearAllImages();
          Alert.alert('Done', 'All data has been cleared.');
        } catch (error: unknown) {
          Alert.alert('Error', getErrorMessage(error));
        }
      },
      'Delete Everything',
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
    >
      {/* Profile Section */}
      <Animated.View
        entering={FadeInDown.duration(ANIMATION_DURATION.screenEntrance).delay(
          STAGGER_DELAY.initialOffset,
        )}
        exiting={FadeOut.duration(ANIMATION_DURATION.exit)}
      >
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Account</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          {user ? (
            <TouchableOpacity style={styles.profileRow}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={[styles.avatarText, { color: colors.white }]}>
                  {user.displayName?.charAt(0).toUpperCase() ||
                    user.email?.charAt(0).toUpperCase() ||
                    'U'}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: colors.textPrimary }]}>
                  {user.displayName || 'User'}
                </Text>
                <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
                  {user.email}
                </Text>
              </View>
              <ChevronRight color={colors.textTertiary} size={20} />
            </TouchableOpacity>
          ) : (
            <SettingRow
              icon={<User color={colors.primary} size={20} />}
              iconBg={colors.primary + '20'}
              title="Sign In"
              subtitle="Sync your data across devices"
              onPress={() => router.push('/auth/login')}
            />
          )}
        </View>
      </Animated.View>

      {/* AI Features */}
      <Animated.View
        entering={FadeInDown.duration(ANIMATION_DURATION.screenEntrance).delay(
          STAGGER_DELAY.initialOffset + STAGGER_DELAY.section,
        )}
        exiting={FadeOut.duration(ANIMATION_DURATION.exit)}
      >
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>AI Features</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <SettingRow
            icon={<Key color={colors.info} size={20} />}
            iconBg={colors.info + '20'}
            title="Claude API Key"
            subtitle={hasKey ? 'API key configured' : 'Required for AI features'}
            onPress={() => setShowApiInput(!showApiInput)}
            rightElement={
              hasKey ? (
                <TouchableOpacity onPress={handleDeleteApiKey}>
                  <Trash2 color={colors.error} size={20} />
                </TouchableOpacity>
              ) : undefined
            }
            showChevron={!hasKey}
          />

          {showApiInput && !hasKey && (
            <View style={styles.apiKeyInput}>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary },
                ]}
                value={apiKeyInput}
                onChangeText={setApiKeyInput}
                placeholder="sk-ant-api..."
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                secureTextEntry
              />
              <AnimatedButton title="Save" onPress={handleSaveApiKey} size="sm" />
            </View>
          )}

          <Text style={[styles.apiNote, { color: colors.textTertiary }]}>
            Get your API key at console.anthropic.com
          </Text>
        </View>
      </Animated.View>

      {/* Appearance */}
      <Animated.View
        entering={FadeInDown.duration(ANIMATION_DURATION.screenEntrance).delay(
          STAGGER_DELAY.initialOffset + STAGGER_DELAY.section * 2,
        )}
        exiting={FadeOut.duration(ANIMATION_DURATION.exit)}
      >
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Appearance</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <SettingRow
            icon={<Moon color={colors.sleep} size={20} />}
            iconBg={colors.sleep + '20'}
            title="Theme"
            subtitle={isDark ? 'Dark mode enabled' : 'Light mode enabled'}
            showChevron={false}
          />
          <ThemePicker />
        </View>
      </Animated.View>

      {/* Preferences */}
      <Animated.View
        entering={FadeInDown.duration(ANIMATION_DURATION.screenEntrance).delay(
          STAGGER_DELAY.initialOffset + STAGGER_DELAY.section * 3,
        )}
        exiting={FadeOut.duration(ANIMATION_DURATION.exit)}
      >
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Preferences</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <SettingRow
            icon={<Target color={colors.primary} size={20} />}
            iconBg={colors.primary + '20'}
            title="My Goals"
            subtitle="Set your health targets"
            onPress={() => router.push('/goals')}
          />

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <SettingRow
            icon={<Bell color={colors.warning} size={20} />}
            iconBg={colors.warning + '20'}
            title="Notifications"
            subtitle="Daily reminders for habits"
            showChevron={false}
            rightElement={
              <Switch
                testID="notification-toggle"
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: colors.surfaceSecondary, true: colors.primary }}
                thumbColor={colors.white}
              />
            }
          />
        </View>
      </Animated.View>

      {/* Data */}
      <Animated.View
        entering={FadeInDown.duration(ANIMATION_DURATION.screenEntrance).delay(
          STAGGER_DELAY.initialOffset + STAGGER_DELAY.section * 4,
        )}
        exiting={FadeOut.duration(ANIMATION_DURATION.exit)}
      >
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Data</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <SettingRow
            icon={<Download color={colors.info} size={20} />}
            iconBg={colors.info + '20'}
            title="Export All Data"
            subtitle="Download as JSON file"
            onPress={handleExportData}
          />

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <SettingRow
            icon={<Download color={colors.success} size={20} />}
            iconBg={colors.success + '20'}
            title="Export as CSV"
            subtitle="Download individual categories"
            onPress={handleExportCSV}
          />

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <SettingRow
            icon={<Trash2 color={colors.error} size={20} />}
            iconBg={colors.error + '20'}
            title="Clear All Data"
            subtitle="Delete all health records"
            onPress={handleClearData}
          />
        </View>
      </Animated.View>

      {/* Support */}
      <Animated.View
        entering={FadeInDown.duration(ANIMATION_DURATION.screenEntrance).delay(
          STAGGER_DELAY.initialOffset + STAGGER_DELAY.section * 5,
        )}
        exiting={FadeOut.duration(ANIMATION_DURATION.exit)}
      >
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Support</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <SettingRow
            icon={<Star color={colors.warning} size={20} />}
            iconBg={colors.warning + '20'}
            title="Rate Trackr"
            subtitle="Love the app? Leave a review!"
            onPress={() => Linking.openURL(APP_LINKS.APP_STORE)}
          />

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <SettingRow
            icon={<Share2 color={colors.success} size={20} />}
            iconBg={colors.success + '20'}
            title="Share with Friends"
            subtitle="Spread the word"
            onPress={() => Alert.alert('Share', 'Share functionality coming soon!')}
          />

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <SettingRow
            icon={<Mail color={colors.journal} size={20} />}
            iconBg={colors.journal + '20'}
            title="Contact Support"
            subtitle="Get help or send feedback"
            onPress={() => Linking.openURL(APP_LINKS.SUPPORT_EMAIL)}
          />

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <SettingRow
            icon={<Shield color={colors.textTertiary} size={20} />}
            iconBg={colors.surfaceSecondary}
            title="Privacy Policy"
            subtitle="How we handle your data"
            onPress={() =>
              Alert.alert(
                'Privacy Policy',
                'All your data is stored locally on your device. Trackr does not collect, transmit, or share any personal information. AI features send data only to the Claude API when explicitly triggered by you.',
              )
            }
          />
        </View>
      </Animated.View>

      {/* Sign Out */}
      {user && (
        <Animated.View
          entering={FadeInDown.duration(ANIMATION_DURATION.screenEntrance).delay(
            STAGGER_DELAY.initialOffset + STAGGER_DELAY.section * 6,
          )}
          exiting={FadeOut.duration(ANIMATION_DURATION.exit)}
        >
          <View
            style={[styles.section, styles.signOutSection, { backgroundColor: colors.surface }]}
          >
            <SettingRow
              icon={<LogOut color={colors.error} size={20} />}
              iconBg={colors.error + '20'}
              title="Sign Out"
              onPress={handleSignOut}
              showChevron={false}
              danger
            />
          </View>
        </Animated.View>
      )}

      {/* App Version */}
      <Text style={[styles.version, { color: colors.textTertiary }]}>
        Trackr v{Constants.expoConfig?.version ?? '1.0.0'}
      </Text>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
    marginLeft: spacing.xs,
  },
  section: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '600',
  },
  profileEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.md + 36 + spacing.md,
  },
  apiKeyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: 15,
  },
  apiNote: {
    fontSize: 13,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  signOutSection: {
    marginTop: spacing.lg,
  },
  version: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
