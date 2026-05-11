import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { FlatList, ListRenderItem, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/split-the-g/button';
import { Card } from '@/components/split-the-g/screen';
import { Body, Eyebrow, Muted, Title } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import { fetchPublicCompetitions } from '@/lib/api/client';
import type { CompetitionSummary } from '@/lib/api/types';
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

export default function CompeteScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const competitions = useQuery({
    queryKey: ['competitions', 'public'],
    queryFn: () => fetchPublicCompetitions(40),
  });

  const renderItem: ListRenderItem<CompetitionSummary> = ({ item }) => (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/competition/${encodeURIComponent(item.id)}`)}
      style={({ pressed }) => pressed && styles.pressed}>
      <Card>
        <Title style={titleCompact}>{item.title}</Title>
        <Muted>{formatRange(item.starts_at, item.ends_at)}</Muted>
        <Body style={ruleLine}>
          {item.win_rule.replace(/_/g, ' ')}
          {item.visibility ? ` · ${item.visibility}` : ''}
        </Body>
      </Card>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.content}
        data={competitions.data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={styles.header}>
            <Eyebrow>{t('competeEyebrow')}</Eyebrow>
            <Title>{t('competeTitle')}</Title>
            <Muted>{t('competeSubtitle')}</Muted>
            <AppButton label="Create competition" onPress={() => router.push('/competition/create')} />
          </View>
        }
        ListEmptyComponent={
          competitions.isLoading ? (
            <Card>
              <Body>Loading competitions…</Body>
            </Card>
          ) : competitions.error ? (
            <Card>
              <Body>Couldn’t load competitions</Body>
              <Muted>{competitions.error.message}</Muted>
            </Card>
          ) : (
            <Card>
              <Body>{t('competeEmpty')}</Body>
            </Card>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={competitions.isRefetching}
            onRefresh={() => competitions.refetch()}
            tintColor={brandColors.gold}
          />
        }
      />
    </SafeAreaView>
  );
}

const titleCompact = { fontSize: 18, lineHeight: 24 };
const ruleLine = { fontSize: 14, opacity: 0.9 };

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: brandColors.black,
  },
  list: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 132,
    gap: 14,
  },
  header: {
    gap: 10,
    marginBottom: 8,
    paddingTop: 8,
  },
  pressed: {
    opacity: 0.88,
  },
});
