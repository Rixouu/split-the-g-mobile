import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { PubGoldMapPin } from '@/components/pub/pub-gold-map-pin';
import { PubWallPanel } from '@/components/pub/pub-wall-panel';
import { AppButton } from '@/components/split-the-g/button';
import { NavigationBackButton } from '@/components/split-the-g/navigation-back-button';
import { PromotionSpotCard } from '@/components/split-the-g/promotion-spot-card';
import { ScreenLoadingBlock } from '@/components/split-the-g/screen-loading';
import { Card, Screen, UNDER_STACK_HEADER_SAFE_AREA_EDGES } from '@/components/split-the-g/screen';
import { Body, Eyebrow, Muted, Title } from '@/components/split-the-g/typography';
import { colors, radii, spacing, typeScale } from '@/constants/design-tokens';
import { GOOGLE_MAP_DARK_STYLE } from '@/constants/google-dark-map-style';
import { brandColors } from '@/constants/theme';
import { fetchPubDetailPage } from '@/lib/api/client';
import type { PubLinkedCompetitionRow } from '@/lib/api/types';
import { deleteFavoriteBar, insertFavoriteBar } from '@/lib/api/profile';
import { useAuth } from '@/lib/auth/auth-context';
import { useLocale } from '@/lib/i18n/locale-context';
import { resolvePubMapCoords } from '@/lib/pub/resolve-pub-map-coords';

const BANGKOK_REGION = {
  latitude: 13.7563,
  longitude: 100.5018,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

const MAIL_ADS = 'mailto:contact@split-the-g.app?subject=Split%20the%20G%20%E2%80%94%20banner%20ads';

function formatSpend(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '—';
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function parseWeekdayHoursLine(line: string): { day: string; hours: string } | null {
  const idx = line.indexOf(':');
  if (idx <= 0) return null;
  const day = line.slice(0, idx).trim();
  const hours = line.slice(idx + 1).trim();
  if (!day || !hours) return null;
  return { day, hours };
}

function weekdayLabelToday(): string {
  return new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(new Date());
}

function isSameWeekdayLabel(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function PubDetailEmptyCallout({
  icon,
  title,
  body,
  variant,
}: {
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  title?: string;
  body: string;
  variant: 'panel' | 'inline';
}) {
  const isPanel = variant === 'panel';
  return (
    <View
      style={[
        styles.emptyCallout,
        !isPanel && styles.emptyCalloutInline,
        !isPanel && styles.emptyCalloutInlineAlign,
      ]}
      accessibilityRole="text"
      accessibilityLabel={title ? `${title}. ${body}` : body}>
      <View
        style={[
          styles.emptyCalloutIconWrap,
          !isPanel && styles.emptyCalloutIconWrapInline,
          !isPanel && styles.emptyCalloutIconWrapInlineAlign,
        ]}>
        <MaterialCommunityIcons
          name={icon}
          size={isPanel ? 28 : 22}
          color={brandColors.goldBright}
        />
      </View>
      {title ? (
        <Text style={[styles.emptyCalloutTitle, !isPanel && styles.emptyCalloutTitleInline]}>{title}</Text>
      ) : null}
      <Text style={[styles.emptyCalloutBody, !isPanel && styles.emptyCalloutBodyInline]}>{body}</Text>
    </View>
  );
}

/** In-card section label — reads as native “group header”, not marketing chrome. */
function CardSectionHeading({ children }: { children: string }) {
  return <Text style={styles.cardSectionHeading}>{children}</Text>;
}

function StatMini({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <View style={styles.statMini}>
      <Text style={styles.statMiniLabel}>{label}</Text>
      <Text style={styles.statMiniValue}>{value}</Text>
      <Text style={styles.statMiniHint}>{hint}</Text>
    </View>
  );
}

function OpeningHoursLines({ lines, todayBadge }: { lines: string[]; todayBadge: string }) {
  const today = weekdayLabelToday();
  return (
    <View style={styles.hoursBox}>
      {lines.map((line, i) => {
        const parsed = parseWeekdayHoursLine(line);
        const isToday = parsed != null && isSameWeekdayLabel(parsed.day, today);
        if (parsed) {
          return (
            <View
              key={`${i}-${line}`}
              style={[styles.hoursRow, isToday && styles.hoursRowToday]}
              accessibilityLabel={`${parsed.day} ${parsed.hours}`}>
              <View style={styles.hoursDayCol}>
                <Text style={[styles.hoursDay, isToday && styles.hoursDayToday]}>{parsed.day}</Text>
                {isToday ? (
                  <Text style={styles.hoursTodayBadge}>{todayBadge}</Text>
                ) : null}
                <Text style={[styles.hoursMobileHours, isToday && styles.hoursHoursToday]}>
                  {parsed.hours}
                </Text>
              </View>
            </View>
          );
        }
        return (
          <View key={`${i}-${line}`} style={styles.hoursRowPlain}>
            <View style={styles.hoursBullet} />
            <Text style={styles.hoursPlainText}>{line}</Text>
          </View>
        );
      })}
    </View>
  );
}

function formatCompRange(starts: string, ends: string): string {
  try {
    const s = new Date(starts);
    const e = new Date(ends);
    return `${s.toLocaleDateString()} – ${e.toLocaleDateString()}`;
  } catch {
    return `${starts} – ${ends}`;
  }
}

type PubTab = 'promos' | 'competitions' | 'wall';

export default function PubDetailScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { t } = useLocale();
  const { user } = useAuth();
  const { barKey: rawKey } = useLocalSearchParams<{ barKey: string }>();
  const barKey =
    decodeURIComponent(
      typeof rawKey === 'string' ? rawKey : Array.isArray(rawKey) ? (rawKey[0] ?? '') : '',
    ).trim() || '';

  const [pubTab, setPubTab] = useState<PubTab>('wall');
  const [favoriteToast, setFavoriteToast] = useState<'added' | 'removed' | null>(null);

  useEffect(() => {
    if (!favoriteToast) return;
    const id = setTimeout(() => setFavoriteToast(null), 2800);
    return () => clearTimeout(id);
  }, [favoriteToast]);

  const q = useQuery({
    queryKey: ['pub-detail', barKey, user?.id ?? 'anon'],
    queryFn: () => fetchPubDetailPage(barKey, user?.id ?? null),
    enabled: Boolean(barKey),
  });

  const page = q.data;
  const bar = page?.bar;

  const resolvedPlaceId = useMemo(() => {
    const fromPlace = page?.placeDetails?.google_place_id?.trim();
    const fromBar = bar?.google_place_id?.trim();
    return fromPlace || fromBar || null;
  }, [page?.placeDetails?.google_place_id, bar?.google_place_id]);

  const openingLines = useMemo(() => {
    const raw = page?.placeDetails?.opening_hours?.trim();
    if (!raw) return [] as string[];
    return raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
  }, [page?.placeDetails?.opening_hours]);

  const promosContentFlags = useMemo(() => {
    const hasGuinnessInfo = Boolean(page?.placeDetails?.guinness_info?.trim());
    const hasAlcoholPromos = Boolean(page?.placeDetails?.alcohol_promotions?.trim());
    return {
      hasGuinnessInfo,
      hasAlcoholPromos,
      promosTabFullyEmpty: !hasGuinnessInfo && !hasAlcoholPromos,
    };
  }, [page?.placeDetails?.guinness_info, page?.placeDetails?.alcohol_promotions]);

  const mapsPlaceUrl = page?.placeDetails?.maps_place_url ?? null;

  const cachedFromDirectory = useMemo((): { lat: number; lng: number } | null => {
    const lat = page?.placeDetails?.latitude;
    const lng = page?.placeDetails?.longitude;
    if (lat == null || lng == null) return null;
    const a = typeof lat === 'number' ? lat : Number.parseFloat(String(lat));
    const b = typeof lng === 'number' ? lng : Number.parseFloat(String(lng));
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    return { lat: a, lng: b };
  }, [page?.placeDetails?.latitude, page?.placeDetails?.longitude]);

  const mapCoordsQuery = useQuery({
    queryKey: [
      'pub-map-coords',
      barKey,
      resolvedPlaceId,
      bar?.display_name,
      bar?.sample_address,
      mapsPlaceUrl,
      cachedFromDirectory?.lat,
      cachedFromDirectory?.lng,
    ],
    queryFn: () =>
      resolvePubMapCoords(
        resolvedPlaceId,
        bar!.display_name || '',
        bar!.sample_address ?? null,
        mapsPlaceUrl,
        cachedFromDirectory,
      ),
    enabled: Boolean(bar),
    staleTime: 86_400_000,
  });

  const mapRegion = useMemo(() => {
    const c = mapCoordsQuery.data;
    if (c && Number.isFinite(c.lat) && Number.isFinite(c.lng)) {
      return {
        latitude: c.lat,
        longitude: c.lng,
        latitudeDelta: 0.0045,
        longitudeDelta: 0.0045,
      };
    }
    return BANGKOK_REGION;
  }, [mapCoordsQuery.data]);

  const mapPin = mapCoordsQuery.data;
  const mapKey =
    mapPin && Number.isFinite(mapPin.lat) && Number.isFinite(mapPin.lng)
      ? `pin-${mapPin.lat}-${mapPin.lng}`
      : 'region-fallback';

  const favMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !page) throw new Error('sign-in');
      if (page.favId) await deleteFavoriteBar(page.favId);
      else await insertFavoriteBar(user.id, page.bar.bar_key, page.bar.sample_address);
    },
    onMutate: async () => ({ wasFavorite: Boolean(page?.favId) }),
    onSuccess: async (_data, _variables, context) => {
      void qc.invalidateQueries({ queryKey: ['pub-detail', barKey, user?.id ?? 'anon'] });
      if (user?.id) void qc.invalidateQueries({ queryKey: ['favorites', user.id] });
      if (context?.wasFavorite) {
        setFavoriteToast('removed');
      } else {
        setFavoriteToast('added');
      }
      try {
        if (context?.wasFavorite) {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch {
        /* haptics unavailable (e.g. web) */
      }
    },
  });

  async function openInGoogleMaps() {
    if (!bar) return;
    if (resolvedPlaceId) {
      const url = `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(resolvedPlaceId)}`;
      if (await Linking.canOpenURL(url)) void Linking.openURL(url);
      return;
    }
    const query = [bar.display_name, bar.sample_address].filter(Boolean).join(', ').trim();
    if (!query) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    if (await Linking.canOpenURL(url)) void Linking.openURL(url);
  }

  function openCompetition(c: PubLinkedCompetitionRow) {
    const ref = (c.path_segment && c.path_segment.trim()) || c.id;
    router.push(`/competition/${encodeURIComponent(ref)}`);
  }

  const avgBlock =
    bar && bar.rating_count > 0 && bar.avg_pour_rating != null && Number.isFinite(bar.avg_pour_rating)
      ? `${bar.avg_pour_rating.toFixed(1)} / 5`
      : t('pubDetailStatDash');

  const ratedHint =
    bar && bar.rating_count > 0
      ? bar.rating_count === 1
        ? t('pubDetailStatRatedPourOne').replace(/\{count\}/g, String(bar.rating_count))
        : t('pubDetailStatRatedPourMany').replace(/\{count\}/g, String(bar.rating_count))
      : t('pubDetailStatNoRatingsYet');

  function goBackToPubs() {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/pubs');
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerBackVisible: false,
          headerLeft: () => <NavigationBackButton accessibilityLabel={t('actionBack')} onPress={goBackToPubs} />,
        }}
      />
      <Screen
        edges={UNDER_STACK_HEADER_SAFE_AREA_EDGES}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.pubScrollContent}>
      <View style={styles.header}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroTitleColumn}>
            <Eyebrow>{t('pubEyebrow')}</Eyebrow>
            {bar ? (
              <Title style={typeScale.titleCompact}>{bar.display_name || t('pubTitleFallback')}</Title>
            ) : (
              <Title style={typeScale.titleCompact}>{q.isLoading ? '…' : t('pubTitleFallback')}</Title>
            )}
          </View>
          {bar && user && page ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                favMutation.isPending
                  ? t('pubDetailFavoriteBusy')
                  : page.favId
                    ? t('pubDetailSaved')
                    : t('pubDetailFavorite')
              }
              disabled={favMutation.isPending}
              onPress={() => favMutation.mutate()}
              hitSlop={10}
              style={({ pressed }) => [
                styles.favIconButton,
                page.favId ? styles.favIconButtonOn : null,
                pressed && styles.favIconButtonPressed,
              ]}>
              {favMutation.isPending ? (
                <ActivityIndicator color={brandColors.goldBright} size="small" />
              ) : (
                <MaterialCommunityIcons
                  name={page.favId ? 'heart' : 'heart-outline'}
                  size={26}
                  color={page.favId ? brandColors.goldBright : brandColors.cream}
                />
              )}
            </Pressable>
          ) : null}
        </View>
        {bar ? <Muted>{t('pubPageTagline')}</Muted> : null}
        {bar?.sample_address ? (
          <Muted style={styles.heroAddress} numberOfLines={4}>
            {bar.sample_address}
          </Muted>
        ) : null}
      </View>

      {favoriteToast ? (
        <Pressable
          accessibilityRole="alert"
          onPress={() => setFavoriteToast(null)}
          style={({ pressed }) => [styles.favoriteToast, pressed && styles.favoriteToastPressed]}>
          <Body style={styles.favoriteToastText}>
            {favoriteToast === 'added' ? t('pubDetailFavoriteToastAdded') : t('pubDetailFavoriteToastRemoved')}
          </Body>
        </Pressable>
      ) : null}

      {q.isLoading ? <ScreenLoadingBlock /> : null}

      {q.error ? (
        <Card>
          <Body>{t('pubLoadError')}</Body>
          <Muted>{q.error.message}</Muted>
        </Card>
      ) : null}

      {!q.isLoading && !q.error && !page ? (
        <Card>
          <Body>{t('pubNotFoundHint')}</Body>
        </Card>
      ) : null}

      {page?.extraError ? (
        <Card>
          <Body>{t('pubDetailExtraStatsError')}</Body>
          <Muted>{page.extraError}</Muted>
        </Card>
      ) : null}

      {bar ? (
        <>
          <Card style={styles.mapCard}>
            <View style={styles.mapShell}>
              <MapView
                key={mapKey}
                style={styles.map}
                region={mapRegion}
                mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
                customMapStyle={Platform.OS === 'android' ? GOOGLE_MAP_DARK_STYLE : undefined}
                showsPointsOfInterest={false}
                scrollEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
                zoomEnabled={false}
                toolbarEnabled={false}>
                {mapPin ? (
                  <Marker
                    coordinate={{ latitude: mapPin.lat, longitude: mapPin.lng }}
                    title={bar.display_name?.trim() || t('pubTitleFallback')}
                    anchor={{ x: 0.5, y: 0.5 }}>
                    <PubGoldMapPin variant="detail" />
                  </Marker>
                ) : null}
              </MapView>
              {mapCoordsQuery.isFetching ? (
                <View style={styles.mapFetchBadge} accessibilityRole="progressbar">
                  <ActivityIndicator color={brandColors.goldBright} size="small" />
                </View>
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('pubDetailMapTapHint')}
                onPress={() => void openInGoogleMaps()}
                style={({ pressed }) => [styles.mapOverlay, pressed && styles.mapOverlayPressed]}>
                <View style={styles.mapHintPill}>
                  <Text style={styles.mapHintText}>{t('pubDetailMapTapHint')}</Text>
                </View>
              </Pressable>
            </View>
            {!user ? (
              <Muted style={styles.mapSignInHint}>{t('pubDetailSignInForFavorite')}</Muted>
            ) : null}
          </Card>

          <Card style={styles.sheetCard}>
            <CardSectionHeading>{t('pubDetailLocationTitle')}</CardSectionHeading>
            <Muted>{t('pubDetailLocationBlurb')}</Muted>
            {!bar.sample_address ? <Muted>{t('pubDetailNoAddressYet')}</Muted> : null}
            <AppButton label={t('pourOpenInMaps')} variant="secondary" onPress={() => void openInGoogleMaps()} />
          </Card>

          <Card style={styles.sheetCard}>
            <CardSectionHeading>{t('pubDetailOpeningHoursTitle')}</CardSectionHeading>
            <Muted>{t('pubDetailOpeningHoursBlurb')}</Muted>
            {openingLines.length > 0 ? (
              <OpeningHoursLines lines={openingLines} todayBadge={t('pubDetailHoursTodayBadge')} />
            ) : (
              <View style={styles.hoursEmpty}>
                <Muted>{t('pubDetailHoursEmpty')}</Muted>
              </View>
            )}
          </Card>

          <Card style={styles.sheetCard}>
            <CardSectionHeading>{t('pubDetailPourActivityTitle')}</CardSectionHeading>
            <Muted>{t('pubDetailPourActivityBlurb')}</Muted>
            <View style={styles.statGrid}>
              <StatMini label={t('pubDetailStatAvgPourRating')} value={avgBlock} hint={ratedHint} />
              <StatMini
                label={t('pubDetailStatPours')}
                value={String(bar.submission_count)}
                hint={t('pubDetailStatRecordedHere')}
              />
              <StatMini
                label={t('pubDetailStatPouring')}
                value={String(page?.extra.distinct_drinkers ?? 0)}
                hint={t('pubDetailStatDistinctPeople')}
              />
              <StatMini
                label={t('pubDetailStatCommunitySpend')}
                value={formatSpend(page?.extra.total_pint_spend ?? 0)}
                hint={t('pubDetailStatPricesOnPours')}
              />
              <View style={[styles.statMini, styles.statMiniWide]}>
                <Text style={styles.statMiniLabel}>{t('pubDetailStatYourSpend')}</Text>
                <Text style={styles.statMiniValue}>
                  {user ? formatSpend(page?.extra.my_pint_spend ?? 0) : t('pubDetailStatDash')}
                </Text>
                <Text style={styles.statMiniHint}>
                  {user ? t('pubDetailSpendSignedInHint') : t('pubDetailSpendSignInHint')}
                </Text>
              </View>
            </View>
          </Card>

          <PromotionSpotCard
            eyebrow={t('pubDetailAdvertiseTitle')}
            description={t('pubDetailAdvertiseBody')}
            actionLabel={t('pubDetailAdvertiseCta')}
            onActionPress={() => void Linking.openURL(MAIL_ADS)}
          />

          <Card style={styles.tabSheetCard}>
            <View style={styles.segmentOuter} accessibilityRole="tablist">
              {(
                [
                  ['promos', t('pubDetailTabPromos')],
                  ['competitions', t('pubDetailTabComps')],
                  ['wall', t('pubDetailTabWall')],
                ] as const
              ).map(([id, label]) => {
                const active = pubTab === id;
                return (
                  <Pressable
                    key={id}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    onPress={() => setPubTab(id)}
                    style={[styles.segmentChip, active && styles.segmentChipActive]}>
                    <Text
                      style={[styles.segmentLabel, active && styles.segmentLabelActive]}
                      numberOfLines={1}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {pubTab === 'promos' ? (
              <View style={styles.tabPanel}>
                <CardSectionHeading>{t('pubDetailGuinnessPromosTitle')}</CardSectionHeading>
                <Muted style={styles.tabBlurb}>{t('pubDetailDirectoryBlurbViewer')}</Muted>
                {promosContentFlags.promosTabFullyEmpty ? (
                  <PubDetailEmptyCallout
                    icon="glass-mug-variant"
                    title={t('pubDetailPromosAllEmptyTitle')}
                    body={t('pubDetailPromosAllEmptyBody')}
                    variant="panel"
                  />
                ) : (
                  <>
                    <Text style={styles.subSection}>{t('pubDetailSectionGuinness')}</Text>
                    {promosContentFlags.hasGuinnessInfo ? (
                      <Text style={styles.preWrap}>{page?.placeDetails?.guinness_info?.trim()}</Text>
                    ) : (
                      <PubDetailEmptyCallout
                        icon="beer-outline"
                        body={t('pubDetailGuinnessEmptyHint')}
                        variant="inline"
                      />
                    )}
                    <Text style={[styles.subSection, styles.subSectionSpaced]}>
                      {t('pubDetailSectionPromotions')}
                    </Text>
                    {promosContentFlags.hasAlcoholPromos ? (
                      <Text style={styles.preWrap}>{page?.placeDetails?.alcohol_promotions?.trim()}</Text>
                    ) : (
                      <PubDetailEmptyCallout
                        icon="tag-outline"
                        body={t('pubDetailPromotionsEmptyHint')}
                        variant="inline"
                      />
                    )}
                  </>
                )}
              </View>
            ) : null}

            {pubTab === 'competitions' ? (
              <View style={styles.tabPanel}>
                <CardSectionHeading>{t('pubDetailLinkedCompsTitle')}</CardSectionHeading>
                {!page?.linkedCompetitions.length ? (
                  <PubDetailEmptyCallout
                    icon="trophy-outline"
                    body={t('pubDetailLinkedCompsEmptyBody')}
                    variant="panel"
                  />
                ) : (
                  <View style={styles.compList}>
                    {page.linkedCompetitions.map((c) => (
                      <View key={c.id} style={styles.compRow}>
                        <View style={styles.compText}>
                          <Body>{c.title}</Body>
                          <Muted>{formatCompRange(c.starts_at, c.ends_at)}</Muted>
                        </View>
                        <AppButton label={t('pubDetailCompOpen')} variant="secondary" onPress={() => openCompetition(c)} />
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ) : null}

            {pubTab === 'wall' ? (
              <View style={styles.tabPanel}>
                <PubWallPanel items={page?.wallPours ?? []} wallError={page?.wallError ?? null} />
              </View>
            ) : null}
          </Card>
        </>
      ) : null}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  pubScrollContent: {
    gap: spacing.md,
  },
  favoriteToast: {
    borderWidth: 1,
    borderColor: brandColors.gold,
    backgroundColor: 'rgba(212, 183, 143, 0.12)',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.cardPadding,
    borderRadius: radii.buttonRounded,
    gap: 4,
  },
  favoriteToastPressed: {
    opacity: colors.cta.pressedOpacity,
  },
  favoriteToastText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  header: {
    gap: spacing.sm + 2,
    paddingTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  heroTitleColumn: {
    flex: 1,
    minWidth: 0,
    gap: spacing.sm + spacing.xs / 2,
  },
  heroAddress: {
    marginTop: 4,
    lineHeight: 20,
  },
  favIconButton: {
    width: 48,
    height: 48,
    borderRadius: radii.card,
    marginTop: -2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.stroke.ctaSecondary,
    backgroundColor: colors.surface.inkTranslucent,
  },
  favIconButtonOn: {
    borderColor: colors.stroke.favActive,
    backgroundColor: colors.surface.favOnTint,
  },
  favIconButtonPressed: {
    opacity: 0.88,
  },
  mapSignInHint: {
    marginTop: 0,
    paddingHorizontal: spacing.cardPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    fontSize: 13,
    lineHeight: 18,
  },
  cardSectionHeading: {
    ...typeScale.sectionTitle,
    marginBottom: 0,
  },
  mapCard: {
    padding: 0,
    gap: 0,
    overflow: 'hidden',
  },
  sheetCard: {
    gap: spacing.sm + 2,
  },
  tabSheetCard: {
    gap: spacing.md,
  },
  mapShell: {
    overflow: 'hidden',
    height: 168,
    borderWidth: 0,
    borderRadius: 0,
    backgroundColor: colors.surface.panel,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 14,
  },
  mapFetchBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(11, 11, 11, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(179, 139, 45, 0.45)',
  },
  mapOverlayPressed: {
    backgroundColor: 'rgba(11, 11, 11, 0.2)',
  },
  mapHintPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(11, 11, 11, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(179, 139, 45, 0.45)',
  },
  mapHintText: {
    color: brandColors.cream,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  statMini: {
    width: '47%',
    flexGrow: 1,
    borderWidth: 0,
    borderRadius: radii.md,
    backgroundColor: colors.surface.hubRow,
    padding: spacing.md,
    gap: 4,
  },
  statMiniWide: {
    width: '100%',
  },
  statMiniLabel: {
    color: 'rgba(212, 183, 143, 0.62)',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statMiniValue: {
    color: brandColors.goldBright,
    fontSize: 20,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  statMiniHint: {
    color: 'rgba(212, 183, 143, 0.45)',
    fontSize: 12,
    lineHeight: 16,
  },
  hoursBox: {
    marginTop: spacing.xs,
    borderWidth: 0,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.surface.hubRow,
  },
  hoursRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: brandColors.borderSubtle,
  },
  hoursRowToday: {
    backgroundColor: 'rgba(179, 139, 45, 0.08)',
  },
  hoursDayCol: {
    flex: 1,
    gap: 4,
  },
  hoursDay: {
    color: 'rgba(212, 183, 143, 0.88)',
    fontSize: 14,
    fontWeight: '700',
  },
  hoursDayToday: {
    color: brandColors.goldBright,
  },
  hoursTodayBadge: {
    alignSelf: 'flex-start',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: 'rgba(197, 160, 89, 0.95)',
    backgroundColor: 'rgba(179, 139, 45, 0.16)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  hoursMobileHours: {
    color: brandColors.cream,
    fontSize: 14,
    lineHeight: 20,
    fontVariant: ['tabular-nums'],
  },
  hoursHoursToday: {
    color: brandColors.cream,
  },
  hoursRowPlain: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: brandColors.borderSubtle,
  },
  hoursBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    backgroundColor: 'rgba(197, 160, 89, 0.65)',
  },
  hoursPlainText: {
    flex: 1,
    color: brandColors.cream,
    fontSize: 14,
    lineHeight: 20,
  },
  hoursEmpty: {
    marginTop: spacing.xs,
    padding: spacing.md,
    borderWidth: 0,
    borderRadius: radii.md,
    backgroundColor: colors.surface.hubRow,
    alignItems: 'center',
  },
  emptyCallout: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: radii.md,
    borderWidth: 0,
    backgroundColor: colors.surface.panelTranslucent,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: 10,
  },
  emptyCalloutInline: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: 8,
  },
  emptyCalloutInlineAlign: {
    alignItems: 'flex-start',
  },
  emptyCalloutIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(179, 139, 45, 0.25)',
    backgroundColor: 'rgba(212, 183, 143, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCalloutIconWrapInline: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  emptyCalloutIconWrapInlineAlign: {
    alignSelf: 'flex-start',
  },
  emptyCalloutTitle: {
    textAlign: 'center',
    color: brandColors.cream,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  emptyCalloutTitleInline: {
    fontSize: 14,
  },
  emptyCalloutBody: {
    textAlign: 'center',
    color: 'rgba(212, 183, 143, 0.78)',
    fontSize: 14,
    lineHeight: 20,
  },
  emptyCalloutBodyInline: {
    textAlign: 'left',
  },
  segmentOuter: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: radii.buttonRounded,
    borderWidth: 1,
    borderColor: brandColors.pourCardStroke,
    backgroundColor: colors.surface.inkTranslucent,
    padding: 4,
    gap: 6,
    minHeight: 48,
    marginBottom: spacing.xs,
  },
  segmentChip: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  segmentChipActive: {
    backgroundColor: brandColors.gold,
  },
  segmentLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(212, 183, 143, 0.88)',
    textAlign: 'center',
    letterSpacing: 0.02,
  },
  segmentLabelActive: {
    color: brandColors.black,
  },
  tabPanel: {
    gap: 12,
  },
  tabBlurb: {
    marginTop: -4,
  },
  subSection: {
    color: brandColors.goldBright,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  subSectionSpaced: {
    marginTop: 14,
  },
  preWrap: {
    color: brandColors.cream,
    fontSize: 15,
    lineHeight: 22,
  },
  compList: {
    gap: 12,
  },
  compRow: {
    gap: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: brandColors.borderSubtle,
  },
  compText: {
    gap: 4,
  },
});
