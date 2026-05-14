import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { Muted } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import { useLocale } from '@/lib/i18n/locale-context';

const stroke = brandColors.pourCardStroke;

interface PourImageCardsProps {
  closeupUrl: string | null;
  annotatedUrl: string | null;
}

function ImageCard({
  title,
  badge,
  hint,
  uri,
  emptyLabel,
}: {
  title: string;
  badge: string;
  hint: string;
  uri: string | null;
  emptyLabel: string;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle}>{title}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        </View>
        <Muted style={styles.hint}>{hint}</Muted>
      </View>
      <View style={styles.imageFrame}>
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
      </View>
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
      <ImageCard
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
      <ImageCard
        title={t('pourSplitGTitle')}
        badge={t('pourCloseupBadge')}
        hint={t('pourCloseupHint')}
        uri={closeupUrl}
        emptyLabel={empty}
      />
      <ImageCard
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
  stack: {
    gap: 14,
  },
  card: {
    borderWidth: 1,
    borderColor: stroke,
    borderRadius: 16,
    backgroundColor: 'rgba(29, 24, 15, 0.3)',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
  },
  cardHeader: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: stroke,
    paddingBottom: 12,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: brandColors.gold,
    letterSpacing: -0.2,
  },
  badge: {
    borderWidth: 1,
    borderColor: stroke,
    backgroundColor: 'rgba(11, 11, 11, 0.45)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(212, 183, 143, 0.72)',
  },
  hint: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(212, 183, 143, 0.68)',
  },
  imageFrame: {
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: stroke,
    backgroundColor: 'rgba(11, 11, 11, 0.55)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  empty: {
    textAlign: 'center',
    paddingHorizontal: 16,
    fontSize: 13,
  },
});
