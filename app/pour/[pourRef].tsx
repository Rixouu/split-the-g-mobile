import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { CompetitionFormInset } from '@/components/competition/competition-form-layout';
import { PourClaimCard } from '@/components/pour-detail/pour-claim-card';
import { PourImageCards } from '@/components/pour-detail/pour-image-cards';
import { PourResultsHeader } from '@/components/pour-detail/pour-results-header';
import { PourScoreSummary } from '@/components/pour-detail/pour-score-summary';
import { PourSharePanel } from '@/components/pour-detail/pour-share-panel';
import { PourSafetyPanel } from '@/components/pour-detail/pour-safety-panel';
import { PourVenueEditor } from '@/components/pour-detail/pour-venue-editor';
import { usePourDetail } from '@/components/pour-detail/hooks/use-pour-detail';
import { NavigationBackButton } from '@/components/split-the-g/navigation-back-button';
import { Screen, UNDER_STACK_HEADER_SAFE_AREA_EDGES } from '@/components/split-the-g/screen';
import { ScreenLoadingBlock } from '@/components/split-the-g/screen-loading';
import { Body, Muted } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import { absoluteWebUrl } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/auth-context';
import { canUnclaimPour, fetchLeaderboardDisplayNameForUser } from '@/lib/auth/leaderboard-display-name';
import { useLocale } from '@/lib/i18n/locale-context';
import { translate } from '@/lib/i18n/translations';
import { getIsPourOwner } from '@/lib/pour/ownership';
import { getPourSessionId } from '@/lib/pour/session';
import { supabase } from '@/lib/supabase/client';

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function PourDetailScreen() {
  const router = useRouter();
  const { t, locale } = useLocale();
  const { user, isLoading: authLoading } = useAuth();
  const raw = useLocalSearchParams<{ pourRef: string | string[] }>();
  const pourRef = (typeof raw.pourRef === 'string' ? raw.pourRef : raw.pourRef?.[0] ?? '').trim();

  const query = usePourDetail(pourRef);
  const refetchPour = query.refetch;

  const d = query.data?.score;
  const pubPageBarKey = query.data?.pubPageBarKey ?? null;

  const [pourSessionId, setPourSessionId] = useState<string | null>(null);

  useEffect(() => {
    void getPourSessionId().then(setPourSessionId);
  }, []);

  const isOwner = Boolean(d && getIsPourOwner(d, pourSessionId, user?.id ?? null));

  const jwtSyncDoneRef = useRef<string | null>(null);

  useEffect(() => {
    jwtSyncDoneRef.current = null;
  }, [pourRef]);

  useEffect(() => {
    if (authLoading || !user?.email || !d?.email?.trim()) return;
    if (!canUnclaimPour(user.email, d.email)) return;
    const key = `${d.id}:${user.id}`;
    if (jwtSyncDoneRef.current === key) return;

    void (async () => {
      try {
        const name = await fetchLeaderboardDisplayNameForUser(user);
        const { error } = await supabase.rpc('sync_scores_username_for_jwt', { p_username: name });
        if (!error) {
          jwtSyncDoneRef.current = key;
          void refetchPour();
        }
      } catch {
        /* best-effort */
      }
    })();
  }, [authLoading, user, d?.id, d?.email, pourRef, refetchPour]);

  const sharePath = d ? `/pour/${d.slug || d.id}` : `/pour/${pourRef}`;
  const webUrl = absoluteWebUrl(sharePath);

  const shareMessage = useMemo(() => {
    if (!d || d.split_score == null) {
      return `${translate(locale, 'pourShareHookMid')}\n\n${webUrl}`;
    }
    return `${translate(locale, 'pourShareHookMid')}\n\nVisual alignment: ${Number(d.split_score).toFixed(2)}/5\nStill-image analysis only — no drinking required.\n\n${webUrl}`;
  }, [d, locale, webUrl]);

  const closeupFirst = d?.g_closeup_image_url?.trim() || d?.split_image_url || null;
  const annotatedUrl = d?.split_image_url ?? null;
  const previewImageUrl = d?.pint_image_url?.trim() || annotatedUrl;

  const onRefresh = useCallback(() => {
    void query.refetch();
  }, [query]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)');
  }, [router]);

  return (
    <>
      <Stack.Screen
        options={{
          headerBackVisible: false,
          headerLeft: () => <NavigationBackButton accessibilityLabel={t('actionBack')} onPress={goBack} />,
        }}
      />
      <Screen
        edges={UNDER_STACK_HEADER_SAFE_AREA_EDGES}
        contentContainerStyle={styles.screenBody}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={onRefresh}
            tintColor={brandColors.gold}
          />
        }>
      <PourResultsHeader />

      {query.isLoading ? (
        <CompetitionFormInset>
          <View style={styles.statePad}>
            <ScreenLoadingBlock contentAlign="start" />
          </View>
        </CompetitionFormInset>
      ) : null}

      {query.error ? (
        <CompetitionFormInset>
          <View style={styles.statePad}>
            <Body>{t('pourLoadError')}</Body>
            <Muted>{query.error.message}</Muted>
          </View>
        </CompetitionFormInset>
      ) : null}

      {d ? (
        <>
          <PourScoreSummary
            score={d}
            pubPageBarKey={pubPageBarKey}
            onPressPub={(barKey) => router.push(`/pub/${encodeURIComponent(barKey)}`)}
          />
          <PourImageCards closeupUrl={closeupFirst} annotatedUrl={annotatedUrl} />

          {isOwner ? (
            <>
              <PourClaimCard pourRef={pourRef} score={d} competitionId={null} />
              <PourVenueEditor pourRef={pourRef} score={d} competitionId={null} />
              {d.created_at ? (
                <CompetitionFormInset>
                  <View style={styles.statePad}>
                    <Muted>{formatWhen(d.created_at)}</Muted>
                  </View>
                </CompetitionFormInset>
              ) : null}
            </>
          ) : null}

          <PourSharePanel
            shareMessage={shareMessage}
            webUrl={webUrl}
            splitScore={Number(d.split_score ?? 0)}
            previewImageUrl={previewImageUrl}
            pubPageBarKey={pubPageBarKey}
            googlePlaceId={d.google_place_id?.trim() || null}
          />
          <PourSafetyPanel score={d} isOwner={isOwner} webUrl={webUrl} />
        </>
      ) : null}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  screenBody: {
    gap: 14,
  },
  statePad: {
    paddingHorizontal: 18,
    paddingVertical: 20,
    gap: 10,
  },
});
