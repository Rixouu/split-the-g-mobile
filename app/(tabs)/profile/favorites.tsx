import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { FavoriteVenueCard } from '@/components/profile/favorite-venue-card';
import { Card, Screen, UNDER_STACK_HEADER_SAFE_AREA_EDGES } from '@/components/split-the-g/screen';
import { ScreenLoadingBlock } from '@/components/split-the-g/screen-loading';
import { Body, Eyebrow, Muted } from '@/components/split-the-g/typography';
import { colors, radii, spacing } from '@/constants/design-tokens';
import { brandColors } from '@/constants/theme';
import {
  barKey,
  deleteFavoriteBar,
  favoriteMapsUrl,
  fetchFavoriteBarStats,
  fetchFavoriteRows,
  type FavoriteRow,
} from '@/lib/api/profile';
import { useAuth } from '@/lib/auth/auth-context';
import { useLocale } from '@/lib/i18n/locale-context';
import { resolveFavoritePubRouteKeys } from '@/lib/pub/resolve-favorite-pub-route-keys';
import { barKeyToPubPathSegment } from '@/lib/routing/pub-path';

type SortMode = 'recent' | 'name' | 'pours';

type ActivityFilter = 'all' | 'withPours' | 'noPours';

function favoriteMatchesQuery(row: FavoriteRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = `${row.bar_name}\n${row.bar_address ?? ''}`.toLowerCase();
  const tokens = q.split(/\s+/).filter(Boolean);
  return tokens.every((t) => hay.includes(t));
}

export default function ProfileFavoritesScreen() {
  const { user } = useAuth();
  const { t, tVars } = useLocale();
  const router = useRouter();
  const qc = useQueryClient();

  const [listSearch, setListSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');

  const listQuery = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: () => fetchFavoriteRows(user!.id),
    enabled: Boolean(user?.id),
  });

  const favKey = listQuery.data?.map((f) => f.id).join('|') ?? '';
  const statsQuery = useQuery({
    queryKey: ['favorite-stats', user?.id, favKey],
    queryFn: () => fetchFavoriteBarStats(listQuery.data!),
    enabled: Boolean(user?.id && listQuery.isSuccess && (listQuery.data?.length ?? 0) > 0),
  });

  const pubRouteKeysQuery = useQuery({
    queryKey: ['favorite-pub-route-keys', user?.id, favKey],
    queryFn: () => resolveFavoritePubRouteKeys(listQuery.data!),
    enabled: Boolean(user?.id && listQuery.isSuccess && (listQuery.data?.length ?? 0) > 0),
    staleTime: 120_000,
  });

  const pubRouteKeys = pubRouteKeysQuery.data ?? {};

  const sortOptions = useMemo(
    () =>
      [
        { mode: 'recent' as const, label: t('profileFavoritesSortRecent') },
        { mode: 'name' as const, label: t('profileFavoritesSortName') },
        { mode: 'pours' as const, label: t('profileFavoritesSortPours') },
      ] as const,
    [t],
  );

  const activityOptions = useMemo(
    () =>
      [
        { mode: 'all' as const, label: t('profileFavoritesActivityAll') },
        { mode: 'withPours' as const, label: t('profileFavoritesActivityWithPours') },
        { mode: 'noPours' as const, label: t('profileFavoritesActivityNoPours') },
      ] as const,
    [t],
  );

  const { rowsFiltered, filteredCount, totalCount } = useMemo(() => {
    const stats = statsQuery.data ?? {};
    const raw = listQuery.data ?? [];
    const totalCount = raw.length;
    const prepared = raw.map((f) => {
      const rowStats = stats[barKey(f.bar_name, f.bar_address)] ?? stats[barKey(f.bar_name)] ?? null;
      const pourCount = rowStats?.count ?? 0;
      return { f, rowStats, pourCount };
    });

    let next = prepared.filter(({ f }) => favoriteMatchesQuery(f, listSearch));

    if (activityFilter === 'withPours') next = next.filter((x) => x.pourCount > 0);
    if (activityFilter === 'noPours') next = next.filter((x) => x.pourCount === 0);

    const sorted = [...next];
    sorted.sort((a, b) => {
      if (sortMode === 'recent') {
        const ta = new Date(a.f.created_at).getTime();
        const tb = new Date(b.f.created_at).getTime();
        return tb - ta;
      }
      if (sortMode === 'name') {
        return a.f.bar_name.localeCompare(b.f.bar_name, undefined, { sensitivity: 'base' });
      }
      const dc = b.pourCount - a.pourCount;
      if (dc !== 0) return dc;
      return a.f.bar_name.localeCompare(b.f.bar_name, undefined, { sensitivity: 'base' });
    });

    const rowsFiltered = sorted.map(({ f, rowStats, pourCount }) => ({ f, rowStats, pourCount }));
    return { rowsFiltered, filteredCount: rowsFiltered.length, totalCount };
  }, [activityFilter, listQuery.data, listSearch, sortMode, statsQuery.data]);

  const delMut = useMutation({
    mutationFn: (id: string) => deleteFavoriteBar(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['favorites', user?.id] }),
  });

  const busy = delMut.isPending;

  const showToolbar = Boolean(user && listQuery.isSuccess && totalCount > 0);

  return (
    <Screen edges={UNDER_STACK_HEADER_SAFE_AREA_EDGES}>
      <Stack.Screen options={{ title: t('profileFavoritesScreenTitle') }} />

      {!user ? (
        <View style={styles.cardLike}>
          <Body>{t('signInPrompt')}</Body>
        </View>
      ) : null}

      {showToolbar ? (
        <Card style={styles.toolbarCard}>
          <View style={styles.searchField}>
            <Ionicons
              name="search-outline"
              size={18}
              color={colors.text.mutedMedium}
              style={styles.searchIcon}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <TextInput
              value={listSearch}
              onChangeText={setListSearch}
              placeholder={t('profileFavoritesListSearchPlaceholder')}
              placeholderTextColor={colors.text.mutedWeak}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
              accessibilityLabel={t('profileFavoritesListSearchAccessibilityLabel')}
            />
          </View>

          <View style={styles.toolbarDivider} />

          <View style={styles.filterBlock}>
            <Eyebrow>{t('profileFavoritesSortLabel')}</Eyebrow>
            <ScrollView
              horizontal
              style={styles.chipScroller}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipScroll}
              accessibilityLabel={t('profileFavoritesSortLabel')}>
              {sortOptions.map(({ mode, label }) => (
                <Pressable
                  key={mode}
                  accessibilityRole="button"
                  accessibilityState={{ selected: sortMode === mode }}
                  hitSlop={6}
                  onPress={() => setSortMode(mode)}
                  style={[styles.chip, sortMode === mode && styles.chipActive]}>
                  <Text style={[styles.chipLabel, sortMode === mode && styles.chipLabelActive]} numberOfLines={1}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterBlock}>
            <Eyebrow>{t('profileFavoritesActivityLabel')}</Eyebrow>
            <ScrollView
              horizontal
              style={styles.chipScroller}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipScroll}
              accessibilityLabel={t('profileFavoritesActivityLabel')}>
              {activityOptions.map(({ mode, label }) => (
                <Pressable
                  key={mode}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activityFilter === mode }}
                  hitSlop={6}
                  onPress={() => setActivityFilter(mode)}
                  style={[styles.chip, activityFilter === mode && styles.chipActive]}>
                  <Text
                    style={[styles.chipLabel, activityFilter === mode && styles.chipLabelActive]}
                    numberOfLines={1}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {filteredCount > 0 ? (
            <View style={styles.toolbarFooter}>
              <Eyebrow style={styles.resultEyebrow}>
                {filteredCount === 1 ? t('pubsVenueOne') : tVars('pubsVenueMany', { count: filteredCount })}
              </Eyebrow>
              {filteredCount !== totalCount ? (
                <Muted style={styles.filteredHint}>
                  {tVars('pubsVenueFilteredHint', { shown: filteredCount, total: totalCount })}
                </Muted>
              ) : null}
            </View>
          ) : null}
        </Card>
      ) : null}

      {user && listQuery.isLoading ? (
        <ScreenLoadingBlock dense style={styles.centerNote} />
      ) : null}

      {user && listQuery.isError ? (
        <View style={styles.cardLike}>
          <Body>{t('pubLoadError')}</Body>
        </View>
      ) : null}

      {user && listQuery.isSuccess && filteredCount > 0 ? (
        <View style={styles.listBlock}>
          {rowsFiltered.map(({ f, rowStats, pourCount }) => {
            const pourLabel =
              pourCount === 1 ? t('pubsCardPourOne') : tVars('pubsCardPourMany', { count: pourCount });
            const ratingDotLabel =
              pourCount === 1
                ? t('pubsCardRatingDotOne')
                : tVars('pubsCardRatingDotMany', { count: String(pourCount) });
            const fallbackSegment = barKeyToPubPathSegment(f.bar_name.trim().toLowerCase());
            const pubRouteBarKey = pubRouteKeys[f.id] ?? fallbackSegment;
            const avgPourRating = rowStats?.avg ?? null;
            const hasRating = pourCount > 0 && avgPourRating != null && Number.isFinite(avgPourRating);
            return (
              <FavoriteVenueCard
                key={f.id}
                title={f.bar_name}
                address={f.bar_address}
                avgPourRating={hasRating ? avgPourRating : null}
                ratingCount={pourCount}
                pourLabel={pourLabel}
                ratingOutOfLabel={t('pubsCardOutOfFive')}
                ratingDotLabel={ratingDotLabel}
                noRatingsLabel={t('pubsCardNoRatingsYet')}
                mapsLabel={t('profileFavoritesMaps')}
                removeLabel={t('profileFavoritesRemove')}
                onPressPrimary={() => router.push(`/pub/${encodeURIComponent(pubRouteBarKey)}`)}
                onPressMaps={() => void Linking.openURL(favoriteMapsUrl(f))}
                onPressRemove={() => delMut.mutate(f.id)}
                removeDisabled={busy}
              />
            );
          })}
        </View>
      ) : null}

      {user && listQuery.isSuccess && totalCount === 0 ? (
        <View style={styles.emptyWrap}>
          <Muted style={styles.emptyNote}>{t('profileFavoritesEmpty')}</Muted>
          <Muted style={styles.emptyHint}>{t('profileFavoritesEmptyHint')}</Muted>
        </View>
      ) : null}

      {user && listQuery.isSuccess && totalCount > 0 && filteredCount === 0 ? (
        <Muted style={styles.emptyNote}>{t('profileFavoritesNoMatches')}</Muted>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardLike: {
    gap: 8,
    borderWidth: 1,
    borderColor: brandColors.frame,
    borderRadius: 16,
    backgroundColor: 'rgba(29, 24, 15, 0.42)',
    padding: 16,
  },
  toolbarCard: {
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.stroke.subtle,
    borderRadius: radii.pill,
    backgroundColor: colors.surface.inkTranslucent,
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
    minHeight: 44,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: Platform.select({ ios: 10, default: 8 }),
    paddingRight: spacing.xs,
    color: colors.text.primary,
    fontSize: 15,
  },
  toolbarDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.stroke.subtle,
  },
  filterBlock: {
    gap: spacing.sm,
  },
  chipScroller: {
    marginHorizontal: -spacing.xs,
  },
  chipScroll: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  chip: {
    flexShrink: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.stroke.ctaSecondary,
    backgroundColor: colors.surface.inkTranslucent,
  },
  chipActive: {
    borderColor: colors.text.accentBright,
    backgroundColor: colors.surface.favOnTint,
  },
  chipLabel: {
    color: colors.text.mutedMedium,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.35,
    textTransform: 'uppercase',
  },
  chipLabelActive: {
    color: colors.text.accentBright,
  },
  toolbarFooter: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.stroke.subtle,
  },
  resultEyebrow: {
    letterSpacing: 1.6,
    color: colors.text.accent,
  },
  filteredHint: {
    fontSize: 13,
    lineHeight: 18,
  },
  listBlock: {
    gap: 12,
  },
  centerNote: {
    paddingVertical: 8,
  },
  emptyWrap: {
    gap: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  emptyNote: {
    textAlign: 'center',
  },
  emptyHint: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 320,
    color: 'rgba(212, 183, 143, 0.55)',
  },
});
