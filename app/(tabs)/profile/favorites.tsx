import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { FavoriteVenueCard } from '@/components/profile/favorite-venue-card';
import { AppButton } from '@/components/split-the-g/button';
import { Card, Screen, UNDER_STACK_HEADER_SAFE_AREA_EDGES } from '@/components/split-the-g/screen';
import { Body, Muted } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import {
  barKey,
  deleteFavoriteBar,
  favoriteMapsUrl,
  fetchFavoriteBarStats,
  fetchFavoriteRows,
  insertFavoriteBar,
} from '@/lib/api/profile';
import { appConfig } from '@/lib/config';
import { useAuth } from '@/lib/auth/auth-context';
import { useLocale } from '@/lib/i18n/locale-context';
import { barKeyToPubPathSegment } from '@/lib/routing/pub-path';
import { fetchPlaceAutocomplete, fetchPlaceDetails, type PlaceAutocompleteItem } from '@/lib/places/google-places';

export default function ProfileFavoritesScreen() {
  const { user } = useAuth();
  const { t, tVars } = useLocale();
  const router = useRouter();
  const qc = useQueryClient();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceAutocompleteItem[]>([]);

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

  useEffect(() => {
    const key = appConfig.googleMapsApiKey?.trim();
    if (!key || name.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const h = setTimeout(() => {
      void fetchPlaceAutocomplete(name).then(setSuggestions);
    }, 280);
    return () => clearTimeout(h);
  }, [name]);

  const addMut = useMutation({
    mutationFn: () => insertFavoriteBar(user!.id, name, address || null),
    onSuccess: async () => {
      setName('');
      setAddress('');
      setSuggestions([]);
      await qc.invalidateQueries({ queryKey: ['favorites', user?.id] });
    },
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteFavoriteBar(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['favorites', user?.id] }),
  });

  const onPick = useCallback(async (item: PlaceAutocompleteItem) => {
    setSuggestions([]);
    const d = await fetchPlaceDetails(item.placeId);
    if (d) {
      setName(d.name || item.mainText);
      setAddress(d.formattedAddress || item.secondaryText);
    } else {
      setName(item.mainText);
      setAddress(item.secondaryText);
    }
  }, []);

  const stats = statsQuery.data ?? {};
  const busy = addMut.isPending || delMut.isPending;

  return (
    <Screen edges={UNDER_STACK_HEADER_SAFE_AREA_EDGES}>
      <Stack.Screen options={{ title: t('profileFavoritesScreenTitle') }} />

      {!user ? (
        <Card>
          <Body>{t('signInPrompt')}</Body>
        </Card>
      ) : null}

      {user ? (
        <Card>
          <Body style={styles.sectionTitle}>{t('profileFavoritesSectionTitle')}</Body>
          <Muted style={styles.blurb}>{t('profileFavoritesSectionBlurb')}</Muted>

          <Muted style={styles.fieldLabel}>{t('profileFavoritesSearchLabel')}</Muted>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('profileFavoritesPlacesPlaceholder')}
            placeholderTextColor={brandColors.tanMuted}
            style={styles.input}
          />
          {suggestions.length > 0 ? (
            <View style={styles.suggest}>
              {suggestions.map((s) => (
                <Pressable key={s.placeId} onPress={() => void onPick(s)} style={styles.suggestRow}>
                  <Body>{s.mainText}</Body>
                  <Muted numberOfLines={2}>{s.secondaryText}</Muted>
                </Pressable>
              ))}
            </View>
          ) : null}

          <AppButton
            label={t('profileFavoritesSaveButton')}
            variant="primary"
            shape="rounded"
            fullWidth
            disabled={busy || !name.trim()}
            onPress={() => addMut.mutate()}
          />
          <Muted style={styles.hint}>{t('profileFavoritesAddressHint')}</Muted>
        </Card>
      ) : null}

      {user && listQuery.isLoading ? (
        <Muted style={styles.centerNote}>{t('commonLoading')}</Muted>
      ) : null}

      {user && listQuery.isError ? (
        <Card>
          <Body>{t('pubLoadError')}</Body>
        </Card>
      ) : null}

      {user && listQuery.isSuccess && (listQuery.data?.length ?? 0) > 0 ? (
        <View style={styles.listBlock}>
          {listQuery.data!.map((f) => {
            const rowStats =
              stats[barKey(f.bar_name, f.bar_address)] ?? stats[barKey(f.bar_name)] ?? null;
            const pourCount = rowStats?.count ?? 0;
            const pourLabel =
              pourCount === 1 ? t('pubsCardPourOne') : tVars('pubsCardPourMany', { count: pourCount });
            const ratingDotLabel =
              pourCount === 1
                ? t('pubsCardRatingDotOne')
                : tVars('pubsCardRatingDotMany', { count: String(pourCount) });
            const barKeySegment = barKeyToPubPathSegment(f.bar_name.trim().toLowerCase());
            return (
              <FavoriteVenueCard
                key={f.id}
                title={f.bar_name}
                address={f.bar_address}
                avgPourRating={rowStats?.avg ?? null}
                ratingCount={pourCount}
                pourLabel={pourLabel}
                ratingOutOfLabel={t('pubsCardOutOfFive')}
                ratingDotLabel={ratingDotLabel}
                noRatingsLabel={t('pubsCardNoRatingsYet')}
                mapsLabel={t('profileFavoritesMaps')}
                removeLabel={t('profileFavoritesRemove')}
                onPressPrimary={() =>
                  router.push({ pathname: '/pub/[barKey]', params: { barKey: barKeySegment } })
                }
                onPressMaps={() => void Linking.openURL(favoriteMapsUrl(f))}
                onPressRemove={() => delMut.mutate(f.id)}
                removeDisabled={busy}
              />
            );
          })}
        </View>
      ) : null}

      {user && listQuery.isSuccess && (listQuery.data?.length ?? 0) === 0 ? (
        <Muted style={styles.centerNote}>{t('profileFavoritesEmpty')}</Muted>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontWeight: '700',
    fontSize: 18,
    color: brandColors.gold,
    marginBottom: 6,
  },
  blurb: {
    marginBottom: 16,
    lineHeight: 20,
  },
  fieldLabel: {
    marginBottom: 6,
    color: 'rgba(212, 183, 143, 0.85)',
    fontWeight: '600',
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(179, 139, 45, 0.28)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: brandColors.cream,
    backgroundColor: 'rgba(11, 11, 11, 0.45)',
  },
  suggest: {
    borderWidth: 1,
    borderColor: brandColors.frame,
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 4,
    maxHeight: 160,
    overflow: 'hidden',
  },
  suggestRow: {
    padding: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: brandColors.borderSubtle,
  },
  hint: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(212, 183, 143, 0.55)',
  },
  listBlock: {
    gap: 12,
    marginTop: 2,
  },
  centerNote: {
    textAlign: 'center',
    paddingVertical: 8,
  },
});
