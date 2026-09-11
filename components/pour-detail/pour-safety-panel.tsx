import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';

import { CompetitionFormInset } from '@/components/competition/competition-form-layout';
import { AppButton } from '@/components/split-the-g/button';
import { Muted } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import type { PourScore } from '@/lib/api/types';
import { blockScoreActor, scoreActorKey } from '@/lib/moderation/content-safety';

interface PourSafetyPanelProps {
  score: PourScore;
  isOwner: boolean;
  webUrl: string;
}

function reportMailto(score: PourScore, webUrl: string, reason: string): string {
  const subject = `Split The G content report: ${reason}`;
  const body = [
    `Reason: ${reason}`,
    `Pour ID: ${score.id}`,
    `Posted by: ${score.username?.trim() || 'Anonymous'}`,
    `Link: ${webUrl}`,
    '',
    'Please add any helpful details below:',
  ].join('\n');
  return `mailto:contact@split-the-g.app?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function PourSafetyPanel({ score, isOwner, webUrl }: PourSafetyPanelProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const actorKey = scoreActorKey(score);

  const sendReport = (reason: string) => {
    void Linking.openURL(reportMailto(score, webUrl, reason)).catch(() => {
      Alert.alert('Could not open Mail', 'Email contact@split-the-g.app with the pour link to report it.');
    });
  };

  const report = () => {
    Alert.alert('Report this pour', 'What is wrong with this content?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Inappropriate image', onPress: () => sendReport('Inappropriate image') },
      { text: 'Abusive profile name', onPress: () => sendReport('Abusive profile name') },
      { text: 'Spam or other issue', onPress: () => sendReport('Spam or other issue') },
    ]);
  };

  const block = () => {
    Alert.alert(
      `Block ${score.username?.trim() || 'this user'}?`,
      'Their pours will be hidden from your public feed on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              const didBlock = await blockScoreActor(score);
              if (!didBlock) return;
              await queryClient.invalidateQueries({ queryKey: ['scores'] });
              if (router.canGoBack()) router.back();
              else router.replace('/(tabs)/feed');
            })();
          },
        },
      ],
    );
  };

  if (isOwner) return null;

  return (
    <CompetitionFormInset>
      <View style={styles.panel}>
        <Text style={styles.title}>Community safety</Text>
        <Muted style={styles.body}>
          Reports are reviewed by the Split The G team. Block a profile to hide its pours from your feed.
        </Muted>
        <AppButton label="Report this pour" variant="secondary" shape="rounded" fullWidth onPress={report} />
        {actorKey ? (
          <AppButton
            label={`Block ${score.username?.trim() || 'this user'}`}
            variant="secondary"
            shape="rounded"
            fullWidth
            onPress={block}
          />
        ) : null}
      </View>
    </CompetitionFormInset>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: brandColors.borderSubtle,
    borderRadius: 14,
    backgroundColor: 'rgba(29, 24, 15, 0.35)',
    padding: 16,
  },
  title: {
    color: brandColors.goldBright,
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    lineHeight: 19,
  },
});
