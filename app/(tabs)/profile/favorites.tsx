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
import { Screen, UNDER_STACK_HEADER_SAFE_AREA_EDGES } from '@/components/split-the-g/screen';
import { ScreenLoadingBlock } from '@/components/split-the-g/screen-loading';
import { Body, Eyebrow, Muted } from '@/components/split-the-g/typography';
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
        <View style={styles.filters}>
          <TextInput
            value={listSearch}
            onChangeText={setListSearch}
            placeholder={t('profileFavoritesListSearchPlaceholder')}
            placeholderTextColor={brandColors.tanMuted}
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
            accessibilityLabel={t('profileFavoritesListSearchAccessibilityLabel')}
          />

          <View style={styles.filterLane}>
            <Muted style={styles.laneHint} accessibilityElementsHidden>
              {t('profileFavoritesSortLabel')}
            </Muted>
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

          <View style={styles.filterLane}>
            <Muted style={styles.laneHint} accessibilityElementsHidden>
              {t('profileFavoritesActivityLabel')}
            </Muted>
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
        </View>
      ) : null}

      {filteredCount > 0 ? (
        <View style={styles.listIntro}>
          <Eyebrow style={styles.listEyebrow}>
            {filteredCount === 1 ? t('pubsVenueOne') : tVars('pubsVenueMany', { count: filteredCount })}
          </Eyebrow>
          {filteredCount !== totalCount ? (
            <Muted style={styles.filteredHint}>
              {tVars('pubsVenueFilteredHint', { shown: filteredCount, total: totalCount })}
            </Muted>
          ) : null}
        </View>
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
  filters: {
    gap: 10,
    marginTop: -4,
    marginBottom: -2,
  },
  filterLane: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 34,
  },
  chipScroller: {
    flex: 1,
    minWidth: 0,
  },
  laneHint: {
    flexShrink: 0,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: 'rgba(212, 183, 143, 0.55)',
  },
  chipScroll: {
    alignItems: 'center',
    gap: 8,
    paddingRight: 2,
    paddingVertical: 2,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: 'rgba(179, 139, 45, 0.22)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.select({ ios: 10, default: 8 }),
    color: brandColors.cream,
    fontSize: 15,
    backgroundColor: 'rgba(11, 11, 11, 0.28)',
  },
  chip: {
    flexShrink: 0,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(179, 139, 45, 0.22)',
    backgroundColor: 'rgba(11, 11, 11, 0.2)',
  },
  chipActive: {
    borderColor: brandColors.goldBright,
    backgroundColor: 'rgba(179, 139, 45, 0.12)',
  },
  chipLabel: {
    color: brandColors.tanMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.35,
    textTransform: 'uppercase',
  },
  chipLabelActive: {
    color: brandColors.goldBright,
  },
  listIntro: {
    gap: 6,
    marginTop: -4,
    marginBottom: -4,
  },
  listEyebrow: {
    letterSpacing: 1.8,
  },
  filteredHint: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  listBlock: {
    gap: 12,
    marginTop: 2,
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
