import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/split-the-g/button';
import { Card, Screen } from '@/components/split-the-g/screen';
import { Body, Eyebrow, Muted, Title } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import { fetchCompetitionByRef } from '@/lib/api/client';
import { translationKeyForWinRule } from '@/lib/competition/win-rule-i18n';
import { useAuth } from '@/lib/auth/auth-context';
import { useLocale } from '@/lib/i18n/locale-context';

function formatRange(starts: string, ends: string) {
  try {
    const s = new Date(starts);
    const e = new Date(ends);
    return `${s.toLocaleDateString()} – ${e.toLocaleDateString()}`;
  } catch {
    return `${starts} – ${ends}`;
  }
}

export default function CompetitionDetailScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLocale();
  const { competitionId } = useLocalSearchParams<{ competitionId: string }>();
  const ref = (typeof competitionId === 'string' ? competitionId : competitionId?.[0] ?? '').trim();

  const q = useQuery({
    queryKey: ['competition', ref],
    queryFn: () => fetchCompetitionByRef(ref),
    enabled: Boolean(ref),
  });

  const c = q.data;

  return (
    <Screen>
      <View style={styles.header}>
        <Eyebrow>{t('competitionEyebrow')}</Eyebrow>
        {c ? <Title>{c.title}</Title> : <Title>…</Title>}
        {c ? <Muted>{formatRange(c.starts_at, c.ends_at)}</Muted> : null}
      </View>

      {q.isLoading ? (
        <Card>
          <Body>{t('commonLoading')}</Body>
        </Card>
      ) : null}

      {q.error ? (
        <Card>
          <Body>{t('competitionLoadError')}</Body>
          <Muted>{q.error.message}</Muted>
        </Card>
      ) : null}

      {!q.isLoading && !q.error && !c ? (
        <Card>
          <Body>{t('competitionNotFound')}</Body>
        </Card>
      ) : null}

      {c ? (
        <>
          <Card>
            <Body style={styles.rule}>
              {t('competitionRulePrefix')} {t(translationKeyForWinRule(c.win_rule))}
              {c.target_score != null && c.win_rule === 'closest_to_target'
                ? t('competitionTargetSegment').replace('{score}', String(c.target_score))
                : ''}
            </Body>
            <Muted>
              {t('competitionMetaLine')
                .replace('{visibility}', c.visibility ?? '—')
                .replace('{max}', String(c.max_participants))
                .replace('{glasses}', String(c.glasses_per_person))}
            </Muted>
            {(c.location_name || c.location_address) && (
              <Body style={styles.mt}>
                 {[c.location_name, c.location_address].filter(Boolean).join(' · ')}
              </Body>
            )}
            <Muted style={styles.mt}>{t('competitionWebHint')}</Muted>
          </Card>
          {user?.id === c.created_by ? (
            <AppButton
              label={t('competitionEditCTA')}
              variant="secondary"
              onPress={() => router.push(`/competition/${encodeURIComponent(ref)}/edit`)}
            />
          ) : null}
          {c.linked_bar_key ? (
            <Card>
              <Body>{t('competitionLinkedPub')}</Body>
              <Pressable
                onPress={() => router.push(`/pub/${encodeURIComponent(c.linked_bar_key!)}`)}
                accessibilityRole="button">
                <Body style={styles.link}>{t('competitionOpenPub')}</Body>
              </Pressable>
            </Card>
          ) : null}
        </>
      ) : null}

      <AppButton label={t('competitionBackToList')} variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 10,
    paddingTop: 16,
  },
  rule: {
    marginBottom: 8,
  },
  mt: {
    marginTop: 12,
  },
  link: {
    color: brandColors.gold,
    fontWeight: '700',
    marginTop: 8,
  },
});
