import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { Plus, Camera, X, BookOpen, Search } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, borderRadius } from '@/src/theme';
import {
  AnimatedCard,
  FAB,
  SecondaryFAB,
  FABGroup,
  SkeletonCard,
  ErrorBanner,
} from '@/src/components/ui';
import { useJournalStore } from '@/src/store';
import { getRelativeDateLabel } from '@/src/utils/date';
import { MOOD_LABELS } from '@/src/utils/constants';
import { JournalEntry } from '@/src/types';
import { hasApiKey } from '@/src/services/claude';
import { JournalEntryModal } from '@/src/components/journal';

export default function JournalScreen() {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'text' | 'scan'>('text');
  const [apiKeyExists, setApiKeyExists] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<JournalEntry[] | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [editEntry, setEditEntry] = useState<JournalEntry | undefined>();

  const { entries, isLoading, error, loadEntries, deleteEntry, search, clearError } =
    useJournalStore();

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

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      if (query.trim().length === 0) {
        setSearchResults(null);
        return;
      }
      const results = await search(query.trim());
      setSearchResults(results);
    },
    [search],
  );

  const allTags = React.useMemo(() => {
    const tagSet = new Set<string>();
    entries.forEach((e) => e.tags?.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [entries]);

  const filteredByTag = selectedTag
    ? (searchResults ?? entries).filter((e) => e.tags?.includes(selectedTag))
    : null;
  const displayedEntries = filteredByTag ?? searchResults ?? entries;

  const handleDeleteEntry = (id: string, title: string) => {
    Alert.alert('Delete Entry', `Delete "${title || 'Untitled'}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteEntry(id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const openModal = (mode: 'text' | 'scan') => {
    setModalMode(mode);
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
        {error && <ErrorBanner error={error} onDismiss={clearError} />}

        {entries.length > 0 && (
          <View style={[styles.searchContainer, { backgroundColor: colors.surfaceSecondary }]}>
            <Search color={colors.textTertiary} size={18} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search entries..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <X color={colors.textTertiary} size={18} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {allTags.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tagFilterContainer}
            contentContainerStyle={styles.tagFilterContent}
          >
            {allTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagFilterPill,
                  { backgroundColor: colors.journal + '15' },
                  selectedTag === tag && { backgroundColor: colors.journal },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedTag(selectedTag === tag ? null : tag);
                }}
              >
                <Text
                  style={[
                    styles.tagFilterText,
                    { color: colors.journal },
                    selectedTag === tag && { color: colors.white },
                  ]}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {isLoading && entries.length === 0 ? (
          <>
            <SkeletonCard lines={3} style={{ marginBottom: spacing.sm }} />
            <SkeletonCard lines={3} style={{ marginBottom: spacing.sm }} />
          </>
        ) : displayedEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <BookOpen color={colors.journal} size={48} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery || selectedTag ? 'No matching entries' : 'No journal entries yet'}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
              {searchQuery || selectedTag
                ? 'Try a different search term or tag'
                : 'Start writing or scan a handwritten entry'}
            </Text>
          </View>
        ) : (
          displayedEntries.map((entry, index) => (
            <Animated.View key={entry.id} entering={FadeInDown.duration(400).delay(index * 50)}>
              <AnimatedCard
                style={styles.entryCard}
                delay={index * 50}
                onPress={() => {
                  setEditEntry(entry);
                  setModalMode('text');
                  setModalVisible(true);
                }}
                onLongPress={() => handleDeleteEntry(entry.id, entry.title ?? '')}
              >
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
                {entry.tags && entry.tags.length > 0 && (
                  <View style={styles.tagsRow}>
                    {entry.tags.map((tag) => (
                      <View
                        key={tag}
                        style={[styles.tagBadge, { backgroundColor: colors.journal + '15' }]}
                      >
                        <Text style={[styles.tagText, { color: colors.journal }]}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </AnimatedCard>
            </Animated.View>
          ))
        )}
      </ScrollView>

      <FABGroup>
        <SecondaryFAB
          onPress={() => openModal('scan')}
          backgroundColor={colors.surface}
          borderColor={colors.journal}
          icon={<Camera color={colors.journal} size={20} />}
        />
        <FAB
          grouped
          color={colors.journal}
          onPress={() => openModal('text')}
          icon={<Plus color={colors.white} size={24} />}
        />
      </FABGroup>

      <JournalEntryModal
        visible={modalVisible}
        initialMode={modalMode}
        onClose={() => {
          setModalVisible(false);
          setEditEntry(undefined);
        }}
        apiKeyExists={apiKeyExists}
        editEntry={editEntry}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    marginLeft: spacing.sm,
    paddingVertical: 2,
  },
  tagFilterContainer: {
    marginBottom: spacing.md,
  },
  tagFilterContent: {
    gap: spacing.xs,
  },
  tagFilterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
  },
  tagFilterText: {
    fontSize: 13,
    fontWeight: '500',
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
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  tagBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
