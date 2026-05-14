import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { CompetitionFormInset } from '@/components/competition/competition-form-layout';
import { AppButton } from '@/components/split-the-g/button';
import { Body, Muted } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import type { PourScore } from '@/lib/api/types';
import { attachScoreToCompetition, claimPourWithProfile, unclaimPourScore } from '@/lib/api/client';
import { trackEvent } from '@/lib/analytics/client';
import { useAuth } from '@/lib/auth/auth-context';
import { canUnclaimPour, fetchLeaderboardDisplayNameForUser } from '@/lib/auth/leaderboard-display-name';
import { useLocale } from '@/lib/i18n/locale-context';
import { translate } from '@/lib/i18n/translations';

interface PourClaimCardProps {
  pourRef: string;
  score: PourScore;
  competitionId: string | null;
}

export function PourClaimCard({ pourRef, score, competitionId }: PourClaimCardProps) {
  const { user, isLoading: authLoading, signInWithGoogle } = useAuth();
  const { locale } = useLocale();
  const qc = useQueryClient();
  const [banner, setBanner] = useState<string | null>(null);

  const claimed = Boolean(score.email?.trim());
  const canUnclaim = Boolean(
    user?.email && claimed && canUnclaimPour(user.email, score.email) === true,
  );

  const signInMut = useMutation({
    mutationFn: () => signInWithGoogle(),
    onError: () => {
      setBanner(translate(locale, 'pourMsgClaimFail'));
    },
  });

  const claimMut = useMutation({
    mutationFn: async (): Promise<{ attachPart: string | null }> => {
      if (!user?.email) throw new Error('no_user');
      trackEvent('pour_claim_started', { scoreId: score.id });
      const name = await fetchLeaderboardDisplayNameForUser(user);
      await claimPourWithProfile(score.id, user.email, name);

      let attachPart: string | null = null;
      if (competitionId) {
        try {
          await attachScoreToCompetition(competitionId, score.id);
          attachPart = translate(locale, 'pourMsgAttachCompOk');
          trackEvent('competition_attach_succeeded', { competitionId, scoreId: score.id });
        } catch (err) {
          const reason = err instanceof Error ? err.message : 'unknown';
          attachPart = translate(locale, 'pourMsgAttachCompFail');
          trackEvent('competition_attach_failed', { competitionId, scoreId: score.id, reason });
        }
      }
      return { attachPart };
    },
    onSuccess: (data) => {
      const base = translate(locale, 'pourMsgClaimOk');
      setBanner(data.attachPart ? `${base} — ${data.attachPart}` : base);
      trackEvent('pour_claim_succeeded', { scoreId: score.id });
      void qc.invalidateQueries({ queryKey: ['pourDetail', pourRef] });
    },
    onError: () => {
      trackEvent('pour_claim_failed', { scoreId: score.id });
      setBanner(translate(locale, 'pourMsgClaimFail'));
    },
  });

  const unclaimMut = useMutation({
    mutationFn: () => unclaimPourScore(score.id),
    onSuccess: () => {
      setBanner(translate(locale, 'pourMsgUnclaimOk'));
      void qc.invalidateQueries({ queryKey: ['pourDetail', pourRef] });
    },
    onError: () => {
      setBanner(translate(locale, 'pourMsgUnclaimFail'));
    },
  });

  function promptUnclaim() {
    Alert.alert(translate(locale, 'pourUnclaimConfirmTitle'), translate(locale, 'pourUnclaimConfirmMessage'), [
      { text: translate(locale, 'actionCancel'), style: 'cancel' },
      {
        text: translate(locale, 'actionConfirm'),
        style: 'destructive',
        onPress: () => unclaimMut.mutate(),
      },
    ]);
  }

  return (
    <CompetitionFormInset>
      <View style={styles.inner}>
        <Body style={styles.title}>{translate(locale, 'pourClaimTitle')}</Body>
        <Muted>{translate(locale, 'pourClaimBody')}</Muted>

        {banner ? <Body style={styles.banner}>{banner}</Body> : null}

        <View style={styles.actions}>
        {claimed ? (
          <>
            <Muted>
              {translate(locale, 'pourClaimedLabel').replace(/\{email\}/g, score.email?.trim() ?? '')}
            </Muted>
            {canUnclaim ? (
              <AppButton
                label={unclaimMut.isPending ? translate(locale, 'pourUnclaiming') : translate(locale, 'pourUnclaimButton')}
                variant="secondary"
                disabled={unclaimMut.isPending}
                onPress={promptUnclaim}
              />
            ) : null}
          </>
        ) : user ? (
          <>
            <Muted>{translate(locale, 'pourSignedInAs').replace(/\{email\}/g, user.email ?? '')}</Muted>
            <AppButton
              label={claimMut.isPending ? translate(locale, 'pourClaiming') : translate(locale, 'pourClaimButton')}
              disabled={claimMut.isPending}
              onPress={() => {
                setBanner(null);
                claimMut.mutate();
              }}
            />
          </>
        ) : (
          <AppButton
            label={authLoading || signInMut.isPending ? '…' : translate(locale, 'signInGoogle')}
            disabled={authLoading || signInMut.isPending}
            variant="secondary"
            onPress={() => {
              setBanner(null);
              signInMut.mutate();
            }}
          />
        )}
        </View>
      </View>
    </CompetitionFormInset>
  );
}

const styles = StyleSheet.create({
  inner: {
    gap: 12,
    padding: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: brandColors.cream,
  },
  banner: {
    color: brandColors.goldBright,
  },
  actions: {
    gap: 12,
    marginTop: 4,
  },
});
