import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Plus, Camera, X, BookOpen, Search } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, borderRadius } from '@/src/theme';
import { AnimatedCard } from '@/src/components/ui';
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

  const { entries, error, loadEntries, search, clearError } = useJournalStore();

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

  const displayedEntries = searchResults ?? entries;

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
        {error && (
          <TouchableOpacity
            style={[styles.errorBanner, { backgroundColor: colors.error + '15' }]}
            onPress={clearError}
          >
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            <X color={colors.error} size={16} />
          </TouchableOpacity>
        )}

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

        {displayedEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <BookOpen color={colors.journal} size={48} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery ? 'No matching entries' : 'No journal entries yet'}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
              {searchQuery
                ? 'Try a different search term'
                : 'Start writing or scan a handwritten entry'}
            </Text>
          </View>
        ) : (
          displayedEntries.map((entry, index) => (
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
          <Plus color={colors.white} size={24} />
        </TouchableOpacity>
      </View>

      <JournalEntryModal
        visible={modalVisible}
        initialMode={modalMode}
        onClose={() => setModalVisible(false)}
        apiKeyExists={apiKeyExists}
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
    marginRight: spacing.sm,
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
});
