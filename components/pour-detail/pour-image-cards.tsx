import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { DiscoverSectionTitle, discoverChromeStyles } from '@/components/split-the-g/discover-feed-chrome';
import { Muted } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import { useLocale } from '@/lib/i18n/locale-context';

interface PourImageCardsProps {
  closeupUrl: string | null;
  annotatedUrl: string | null;
}

function ImageSection({
  title,
  badge,
  hint,
  uri,
  emptyLabel,
  spaced,
}: {
  title: string;
  badge: string;
  hint: string;
  uri: string | null;
  emptyLabel: string;
  spaced?: boolean;
}) {
  return (
    <View style={styles.section}>
      <DiscoverSectionTitle style={spaced ? discoverChromeStyles.sectionSpaced : undefined}>{title}</DiscoverSectionTitle>
      <View style={styles.imageShell}>
        {uri ? (
          <Image
            source={{ uri }}
            style={styles.image}
            contentFit="cover"
            cachePolicy="disk"
            recyclingKey={uri}
            transition={200}
          />
        ) : (
          <Muted style={styles.empty}>{emptyLabel}</Muted>
        )}
        <View style={styles.badgePill}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      </View>
      <Muted style={styles.hint}>{hint}</Muted>
    </View>
  );
}

export function PourImageCards({ closeupUrl, annotatedUrl }: PourImageCardsProps) {
  const { t } = useLocale();
  const sameFrame =
    Boolean(closeupUrl && annotatedUrl && closeupUrl.trim() === annotatedUrl.trim());
  const empty = t('pourNoImagePlaceholder');

  if (sameFrame) {
    return (
      <ImageSection
        title={t('pourOriginalPourTitle')}
        badge={t('pourFullFrameBadge')}
        hint={t('pourAnnotatedHint')}
        uri={annotatedUrl}
        emptyLabel={empty}
      />
    );
  }

  return (
    <View style={styles.stack}>
      <ImageSection
        title={t('pourSplitGTitle')}
        badge={t('pourCloseupBadge')}
        hint={t('pourCloseupHint')}
        uri={closeupUrl}
        emptyLabel={empty}
      />
      <ImageSection
        spaced
        title={t('pourOriginalPourTitle')}
        badge={t('pourFullFrameBadge')}
        hint={t('pourAnnotatedHint')}
        uri={annotatedUrl}
        emptyLabel={empty}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {},
  section: {},
  imageShell: {
    position: 'relative',
    aspectRatio: 1,
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(11, 11, 11, 0.55)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: brandColors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badgePill: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(11, 11, 11, 0.78)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(197, 160, 89, 0.35)',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.85,
    textTransform: 'uppercase',
    color: brandColors.goldBright,
  },
  hint: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 2,
    color: 'rgba(212, 183, 143, 0.68)',
  },
  empty: {
    textAlign: 'center',
    paddingHorizontal: 20,
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(212, 183, 143, 0.62)',
  },
});
