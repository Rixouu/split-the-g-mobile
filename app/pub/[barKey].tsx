import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { PubWallPanel } from '@/components/pub/pub-wall-panel';
import { AppButton } from '@/components/split-the-g/button';
import { PromotionSpotCard } from '@/components/split-the-g/promotion-spot-card';
import { Card, Screen, UNDER_STACK_HEADER_SAFE_AREA_EDGES } from '@/components/split-the-g/screen';
import { TextLink } from '@/components/split-the-g/text-link';
import { Body, Eyebrow, Muted, Title } from '@/components/split-the-g/typography';
import { colors, radii, spacing, typeScale } from '@/constants/design-tokens';
import { brandColors } from '@/constants/theme';
import { fetchPubDetailPage } from '@/lib/api/client';
import type { PubLinkedCompetitionRow } from '@/lib/api/types';
import { deleteFavoriteBar, insertFavoriteBar } from '@/lib/api/profile';
import { useAuth } from '@/lib/auth/auth-context';
import { useLocale } from '@/lib/i18n/locale-context';
import { fetchPlaceDetails, geocodeAddress } from '@/lib/places/google-places';

const BANGKOK_REGION = {
  latitude: 13.7563,
  longitude: 100.5018,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

const MAIL_ADS = 'mailto:contact@split-the-g.app?subject=Split%20the%20G%20%E2%80%94%20banner%20ads';

async function resolvePubMapCoords(
  placeId: string | null,
  displayName: string,
  sampleAddress: string | null,
): Promise<{ lat: number; lng: number } | null> {
  const trimmedPlaceId = placeId?.trim();
  if (trimmedPlaceId) {
    const details = await fetchPlaceDetails(trimmedPlaceId);
    if (details && Number.isFinite(details.lat) && Number.isFinite(details.lng)) {
      return { lat: details.lat, lng: details.lng };
    }
  }
  const geoQuery = [displayName.trim(), (sampleAddress ?? '').trim()].filter(Boolean).join(', ');
  if (!geoQuery) return null;
  return geocodeAddress(geoQuery);
}

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

function SectionHeading({ children }: { children: string }) {
  return <Text style={styles.sectionHeading}>{children}</Text>;
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

  const mapCoordsQuery = useQuery({
    queryKey: ['pub-map-coords', barKey, resolvedPlaceId, bar?.display_name, bar?.sample_address],
    queryFn: () =>
      resolvePubMapCoords(resolvedPlaceId, bar!.display_name || '', bar!.sample_address ?? null),
    enabled: Boolean(bar),
    staleTime: 86_400_000,
  });

  const mapRegion = useMemo(() => {
    const c = mapCoordsQuery.data;
    if (c && Number.isFinite(c.lat) && Number.isFinite(c.lng)) {
      return {
        latitude: c.lat,
        longitude: c.lng,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
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
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['pub-detail', barKey, user?.id ?? 'anon'] });
      if (user?.id) void qc.invalidateQueries({ queryKey: ['favorites', user.id] });
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

  return (
    <Screen edges={UNDER_STACK_HEADER_SAFE_AREA_EDGES}>
      <View style={styles.header}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroTitleColumn}>
            <Eyebrow>{t('pubEyebrow')}</Eyebrow>
            {bar ? <Title>{bar.display_name || t('pubTitleFallback')}</Title> : <Title>{q.isLoading ? '…' : t('pubTitleFallback')}</Title>}
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

      {q.isLoading ? (
        <Card>
          <Body>{t('commonLoading')}</Body>
        </Card>
      ) : null}

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
          <View style={styles.section}>
            <View style={styles.mapShell}>
              <MapView
                key={mapKey}
                style={styles.map}
                initialRegion={mapRegion}
                scrollEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
                zoomEnabled={false}
                toolbarEnabled={false}>
                {mapPin ? (
                  <Marker
                    coordinate={{ latitude: mapPin.lat, longitude: mapPin.lng }}
                    title={bar.display_name?.trim() || t('pubTitleFallback')}
                  />
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
            {!user ? <Muted style={styles.mapSignInHint}>{t('pubDetailSignInForFavorite')}</Muted> : null}
          </View>

          <View style={styles.sectionDivider} />

          <View style={styles.section}>
            <SectionHeading>{t('pubDetailLocationTitle')}</SectionHeading>
            <Muted>{t('pubDetailLocationBlurb')}</Muted>
            {!bar.sample_address ? <Muted>{t('pubDetailNoAddressYet')}</Muted> : null}
            <AppButton label={t('pourOpenInMaps')} variant="secondary" onPress={() => void openInGoogleMaps()} />
          </View>

          <View style={styles.sectionDivider} />

          <View style={styles.section}>
            <SectionHeading>{t('pubDetailOpeningHoursTitle')}</SectionHeading>
            <Muted>{t('pubDetailOpeningHoursBlurb')}</Muted>
            {openingLines.length > 0 ? (
              <OpeningHoursLines lines={openingLines} todayBadge={t('pubDetailHoursTodayBadge')} />
            ) : (
              <View style={styles.hoursEmpty}>
                <Muted>{t('pubDetailHoursEmpty')}</Muted>
              </View>
            )}
          </View>

          <View style={styles.sectionDivider} />

          <View style={styles.section}>
            <SectionHeading>{t('pubDetailPourActivityTitle')}</SectionHeading>
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
          </View>

          <View style={styles.sectionDivider} />

          <PromotionSpotCard
            eyebrow={t('pubDetailAdvertiseTitle')}
            description={t('pubDetailAdvertiseBody')}
            actionLabel={t('pubDetailAdvertiseCta')}
            onActionPress={() => void Linking.openURL(MAIL_ADS)}
          />

          <View style={styles.sectionDivider} />

          <View style={styles.section}>
            <View style={styles.tabBar} accessibilityRole="tablist">
              {(
                [
                  ['promos', t('pubDetailTabPromos')],
                  ['competitions', t('pubDetailTabComps')],
                  ['wall', t('pubDetailTabWall')],
                ] as const
              ).map(([id, label]) => (
                <Pressable
                  key={id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: pubTab === id }}
                  onPress={() => setPubTab(id)}
                  style={[styles.tab, pubTab === id && styles.tabActive]}>
                  <Text style={[styles.tabLabel, pubTab === id && styles.tabLabelActive]}>{label}</Text>
                </Pressable>
              ))}
            </View>

            {pubTab === 'promos' ? (
              <View style={styles.tabPanel}>
                <SectionHeading>{t('pubDetailGuinnessPromosTitle')}</SectionHeading>
                <Muted style={styles.tabBlurb}>{t('pubDetailDirectoryBlurbViewer')}</Muted>
                <Text style={styles.subSection}>{t('pubDetailSectionGuinness')}</Text>
                {page?.placeDetails?.guinness_info?.trim() ? (
                  <Text style={styles.preWrap}>{page.placeDetails.guinness_info.trim()}</Text>
                ) : (
                  <Muted>{t('pubDetailGuinnessEmptyHint')}</Muted>
                )}
                <Text style={[styles.subSection, styles.subSectionSpaced]}>{t('pubDetailSectionPromotions')}</Text>
                {page?.placeDetails?.alcohol_promotions?.trim() ? (
                  <Text style={styles.preWrap}>{page.placeDetails.alcohol_promotions.trim()}</Text>
                ) : (
                  <Muted>{t('pubDetailPromotionsEmptyHint')}</Muted>
                )}
              </View>
            ) : null}

            {pubTab === 'competitions' ? (
              <View style={styles.tabPanel}>
                <SectionHeading>{t('pubDetailLinkedCompsTitle')}</SectionHeading>
                {!page?.linkedCompetitions.length ? (
                  <Muted>{t('pubDetailLinkedCompsEmpty')}</Muted>
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
          </View>

        </>
      ) : null}

      <TextLink label={t('actionBack')} onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.md,
    paddingTop: spacing.lg,
    marginBottom: 2,
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
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    gap: 12,
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: brandColors.borderSubtle,
    alignSelf: 'stretch',
  },
  sectionHeading: {
    ...typeScale.pubSectionHeading,
  },
  mapShell: {
    overflow: 'hidden',
    height: 200,
    borderWidth: 1,
    borderColor: colors.stroke.frame,
    borderRadius: radii.card,
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
    gap: 10,
    marginTop: 8,
  },
  statMini: {
    width: '47%',
    flexGrow: 1,
    borderWidth: 1,
    borderColor: brandColors.borderSubtle,
    borderRadius: 12,
    backgroundColor: 'rgba(11, 11, 11, 0.35)',
    padding: 12,
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
    marginTop: 10,
    borderWidth: 1,
    borderColor: brandColors.frame,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(11, 11, 11, 0.28)',
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
    marginTop: 10,
    padding: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: brandColors.frame,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    borderRadius: radii.buttonRounded,
    borderWidth: 1,
    borderColor: colors.cta.secondaryBorder,
    backgroundColor: colors.cta.secondaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  tabActive: {
    backgroundColor: colors.cta.primaryBg,
    borderColor: colors.cta.secondaryBorder,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.cta.secondaryFg,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: colors.cta.primaryFg,
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
