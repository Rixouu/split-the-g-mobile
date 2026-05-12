import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { PourClaimCard } from '@/components/pour-detail/pour-claim-card';
import { PourImageCards } from '@/components/pour-detail/pour-image-cards';
import { PourResultsHeader } from '@/components/pour-detail/pour-results-header';
import { PourScoreSummary } from '@/components/pour-detail/pour-score-summary';
import { PourSharePanel } from '@/components/pour-detail/pour-share-panel';
import { PourVenueEditor } from '@/components/pour-detail/pour-venue-editor';
import { usePourDetail } from '@/components/pour-detail/hooks/use-pour-detail';
import { AppButton } from '@/components/split-the-g/button';
import { Card, Screen } from '@/components/split-the-g/screen';
import { Body, Muted } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import { absoluteWebUrl } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/auth-context';
import { canUnclaimPour, fetchLeaderboardDisplayNameForUser } from '@/lib/auth/leaderboard-display-name';
import { useLocale } from '@/lib/i18n/locale-context';
import { buildPourShareMessage, getPourCelebrationLine, translate } from '@/lib/i18n/translations';
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

const COMPETITION_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function PourDetailScreen() {
  const router = useRouter();
  const { t, locale } = useLocale();
  const { user, isLoading: authLoading } = useAuth();
  const raw = useLocalSearchParams<{ pourRef: string | string[]; competition?: string | string[] }>();
  const pourRef = (typeof raw.pourRef === 'string' ? raw.pourRef : raw.pourRef?.[0] ?? '').trim();
  const competitionRaw = raw.competition;
  const competitionId = (
    typeof competitionRaw === 'string' ? competitionRaw : competitionRaw?.[0] ?? ''
  ).trim();
  const competitionValid = COMPETITION_UUID_RE.test(competitionId);
  const competitionParam = competitionValid ? competitionId : null;

  const query = usePourDetail(pourRef);
  const refetchPour = query.refetch;

  const d = query.data?.score;
  const rank = query.data?.rank;
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
    if (!d || d.split_score == null || !rank) {
      return `${translate(locale, 'pourShareHookMid')}\n\n${webUrl}`;
    }
    return buildPourShareMessage(locale, {
      shareUrl: webUrl,
      splitScore: Number(d.split_score),
      allTimeRank: rank.allTimeRank,
      totalSplits: rank.totalSplits,
      weeklyRank: rank.weeklyRank,
      weeklyTotalSplits: rank.weeklyTotalSplits,
    });
  }, [d, rank, locale, webUrl]);

  const closeupFirst = d?.g_closeup_image_url?.trim() || d?.split_image_url || null;
  const annotatedUrl = d?.split_image_url ?? null;
  const previewImageUrl = d?.pint_image_url?.trim() || annotatedUrl;

  const onRefresh = useCallback(() => {
    void query.refetch();
  }, [query]);

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={query.isRefetching}
          onRefresh={onRefresh}
          tintColor={brandColors.gold}
        />
      }>
      <PourResultsHeader />

      {query.isLoading ? (
        <Card>
          <Body>{t('commonLoading')}</Body>
        </Card>
      ) : null}

      {query.error ? (
        <Card>
          <Body>{t('pourLoadError')}</Body>
          <Muted>{query.error.message}</Muted>
        </Card>
      ) : null}

      {competitionValid ? (
        <Card>
          <Muted>{t('pourCompBanner')}</Muted>
          <AppButton
            label={t('pourOpenCompetition')}
            variant="secondary"
            onPress={() => router.push(`/competition/${encodeURIComponent(competitionId)}`)}
          />
        </Card>
      ) : null}

      {d ? (
        <>
          <PourScoreSummary
            score={d}
            rank={rank ?? null}
            celebration={
              typeof d.split_score === 'number' && Number.isFinite(d.split_score)
                ? getPourCelebrationLine(locale, d.split_score)
                : ''
            }
            pubPageBarKey={pubPageBarKey}
            onPressPub={(barKey) => router.push(`/pub/${encodeURIComponent(barKey)}`)}
          />
          <PourImageCards closeupUrl={closeupFirst} annotatedUrl={annotatedUrl} />

          {isOwner ? (
            <>
              <PourClaimCard pourRef={pourRef} score={d} competitionId={competitionParam} />
              <PourVenueEditor pourRef={pourRef} score={d} competitionId={competitionParam} />
              {d.created_at ? (
                <Card>
                  <Muted>{formatWhen(d.created_at)}</Muted>
                </Card>
              ) : null}
            </>
          ) : null}

          <PourSharePanel
            shareMessage={shareMessage}
            webUrl={webUrl}
            splitScore={Number(d.split_score ?? 0)}
            rank={rank ?? null}
            previewImageUrl={previewImageUrl}
            pubPageBarKey={pubPageBarKey}
            googlePlaceId={d.google_place_id?.trim() || null}
          />
        </>
      ) : null}
    </Screen>
  );
}
