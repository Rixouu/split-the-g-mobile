import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/split-the-g/button';
import { Card, Screen } from '@/components/split-the-g/screen';
import { Body, Eyebrow, Muted, Title } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import { fetchCompetitionByRef } from '@/lib/api/client';

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
        <Eyebrow>Competition</Eyebrow>
        {c ? <Title>{c.title}</Title> : <Title>…</Title>}
        {c ? <Muted>{formatRange(c.starts_at, c.ends_at)}</Muted> : null}
      </View>

      {q.isLoading ? (
        <Card>
          <Body>Loading…</Body>
        </Card>
      ) : null}

      {q.error ? (
        <Card>
          <Body>Could not load this competition.</Body>
          <Muted>{q.error.message}</Muted>
        </Card>
      ) : null}

      {!q.isLoading && !q.error && !c ? (
        <Card>
          <Body>Competition not found or you do not have access (private competitions require the web app and sign-in).</Body>
        </Card>
      ) : null}

      {c ? (
        <>
          <Card>
            <Body style={styles.rule}>
              Rule: {c.win_rule.replace(/_/g, ' ')}
              {c.target_score != null && c.win_rule === 'closest_to_target' ? ` · target ${c.target_score}` : ''}
            </Body>
            <Muted>
              Visibility: {c.visibility ?? '—'} · Max participants: {c.max_participants} · Glasses / person:{' '}
              {c.glasses_per_person}
            </Muted>
            {(c.location_name || c.location_address) && (
              <Body style={styles.mt}>
                 {[c.location_name, c.location_address].filter(Boolean).join(' · ')}
              </Body>
            )}
            <Muted style={styles.mt}>
              Native app shows core metadata only. Joining, invites, in-competition leaderboards, and editing match the
              web app competition page only (not built natively yet).
            </Muted>
          </Card>
          {c.linked_bar_key ? (
            <Card>
              <Body>Linked pub</Body>
              <Pressable
                onPress={() => router.push(`/pub/${encodeURIComponent(c.linked_bar_key!)}`)}
                accessibilityRole="button">
                <Body style={styles.link}>Open pub →</Body>
              </Pressable>
            </Card>
          ) : null}
        </>
      ) : null}

      <AppButton label="Back to competitions list" variant="secondary" onPress={() => router.back()} />
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
