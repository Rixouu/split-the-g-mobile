import { Ionicons } from '@expo/vector-icons';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/split-the-g/button';
import { Eyebrow, Muted } from '@/components/split-the-g/typography';
import { colors } from '@/constants/design-tokens';
import { brandColors } from '@/constants/theme';
import type { ProfileHubBundle } from '@/lib/api/profile-hub-data';
import type { TranslationKey } from '@/lib/i18n/translations';
import { flagEmojiFromIso2 } from '@/lib/utils/country-display';
import { emailDisplayName } from '@/lib/utils/profile-email';

interface SignedInProfileHubProps {
  user: User;
  hub: ProfileHubBundle;
  t: (key: TranslationKey) => string;
  tVars: (key: TranslationKey, vars: Record<string, string | number>) => string;
}

export function SignedInProfileHub({ user, hub, t, tVars }: SignedInProfileHubProps) {
  const router = useRouter();
  const email = user.email ?? '';
  const displayName = hub.publicProfile?.display_name?.trim() || (email ? emailDisplayName(email) : t('profileDefaultName'));
  const nickname = hub.publicProfile?.nickname?.trim() ?? '';
  const handle = nickname ? `@${nickname}` : email ? `@${emailDisplayName(email)}` : '';
  const memberYear = user.created_at ? new Date(user.created_at).getFullYear() : null;
  const countryCode = hub.publicProfile?.country_code?.trim().toUpperCase() ?? '';
  const flagEmoji = countryCode && /^[A-Z]{2}$/.test(countryCode) ? flagEmojiFromIso2(countryCode) : '';
  const analysisCount = hub.scores.length;
  const average = analysisCount > 0 ? hub.scores.reduce((sum, row) => sum + Number(row.split_score ?? 0), 0) / analysisCount : 0;
  const sortedFavs = [...hub.favorites].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const lastFavLabel = sortedFavs[0] ? new Date(sortedFavs[0].created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : null;
  const priced = hub.scores.filter((row) => row.pint_price != null && Number.isFinite(Number(row.pint_price)));
  const totalSpend = priced.reduce((sum, row) => sum + Number(row.pint_price), 0);

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <View style={styles.avatar} accessibilityRole="image" accessibilityLabel={t('profileAccountProfilePhotoSimpleAria')}>
          <Ionicons name="person" size={30} color={colors.text.accent} />
        </View>
        <View style={styles.headerMain}>
          <Eyebrow>{t('profileHubProfileLabel')}</Eyebrow>
          <View style={styles.nameRow}>
            {flagEmoji ? <Text style={styles.flag}>{flagEmoji}</Text> : null}
            <Text style={styles.displayName} numberOfLines={1}>{displayName}</Text>
          </View>
          <Muted style={styles.handleLine} numberOfLines={1}>
            {handle}{handle && memberYear != null ? ' · ' : ''}{memberYear != null ? tVars('profileHubMemberSinceYear', { year: memberYear }) : ''}
          </Muted>
        </View>
        <Pressable onPress={() => router.push('/profile/account')} style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]} accessibilityRole="button">
          <Text style={styles.editBtnLabel}>{t('profileHubEdit')}</Text>
        </Pressable>
      </View>

      <View style={styles.statRow}>
        <StatCard value={String(analysisCount)} label={t('profileHubStatPours')} />
        <StatCard value={average.toFixed(2)} label={t('profileHubStatScore')} />
        <StatCard value={String(hub.favorites.length)} label={t('profileHubStatFriends')} />
      </View>

      <AppButton label={t('profileHubPourCta')} variant="secondary" onPress={() => router.push('/')} />

      <View>
        <Eyebrow style={styles.sectionEyebrow}>{t('profileHubActivitySection')}</Eyebrow>
        <HubRow icon={<Ionicons name="book-outline" size={20} color={colors.text.accent} />} title={t('profileNavScores')} subtitle={tVars('profileHubScoresSolo', { total: analysisCount })} onPress={() => router.push('/journal' as never)} />
        <HubRow icon={<Ionicons name="star-outline" size={20} color={colors.text.accent} />} title={t('profileNavFavorites')} subtitle={hub.favorites.length > 0 && lastFavLabel ? tVars('profileHubFavoritesDated', { count: hub.favorites.length, date: lastFavLabel }) : t('profileHubFavoritesEmpty')} onPress={() => router.push('/profile/favorites')} />
        <HubRow icon={<Ionicons name="wallet-outline" size={20} color={colors.text.accent} />} title={t('profileNavExpenses')} subtitle={priced.length > 0 ? tVars('profileHubExpensesTracked', { amount: totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 }) }) : t('profileHubExpensesEmpty')} onPress={() => router.push('/profile/expenses')} />
      </View>

      <View>
        <Eyebrow style={styles.sectionEyebrow}>{t('profileHubAccountSection')}</Eyebrow>
        <HubRow icon={<Ionicons name="help-circle-outline" size={20} color={colors.text.accent} />} title={t('profileNavFaq')} subtitle={t('profileHubFaqSub')} onPress={() => router.push('/faq')} />
      </View>
    </View>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return <View style={styles.statCard}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

export function HubRow({ icon, title, subtitle, trailing, onPress, accessibilityHint }: { icon: ReactNode; title: string; subtitle: string; trailing?: ReactNode; onPress: () => void; accessibilityHint?: string }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.hubRow, pressed && styles.pressed]} accessibilityRole="button" accessibilityHint={accessibilityHint}>
      <View style={styles.iconWell}>{icon}</View>
      <View style={styles.hubRowBody}><Text style={styles.hubRowTitle}>{title}</Text><Muted style={styles.hubRowSub} numberOfLines={2}>{subtitle}</Muted></View>
      {trailing}<Ionicons name="chevron-forward" size={18} color={colors.chevron.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { gap: 22 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 58, height: 58, borderRadius: 29, borderWidth: 1, borderColor: colors.stroke.hub, backgroundColor: colors.surface.hubIconWell, alignItems: 'center', justifyContent: 'center' },
  headerMain: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  flag: { fontSize: 20, lineHeight: 22 },
  displayName: { flex: 1, fontSize: 18, fontWeight: '600', color: colors.text.accent },
  handleLine: { marginTop: 4, fontSize: 13 },
  editBtn: { borderWidth: 1, borderColor: colors.stroke.hub, backgroundColor: colors.surface.editButton, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  editBtnLabel: { fontSize: 12, fontWeight: '600', color: colors.text.accent },
  pressed: { opacity: 0.88 },
  statRow: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 6, borderRadius: 12, borderWidth: 1, borderColor: colors.stroke.hub, backgroundColor: colors.surface.panelTranslucent },
  statValue: { fontSize: 18, fontWeight: '700', fontVariant: ['tabular-nums'], color: colors.text.accent },
  statLabel: { marginTop: 4, fontSize: 9, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', textAlign: 'center', color: colors.text.mutedMedium },
  sectionEyebrow: { marginBottom: 10 },
  hubRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 68, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.stroke.hub, backgroundColor: colors.surface.hubRow },
  iconWell: { width: 40, height: 40, borderRadius: 8, borderWidth: 1, borderColor: colors.stroke.hub, backgroundColor: colors.surface.hubIconWell, alignItems: 'center', justifyContent: 'center' },
  hubRowBody: { flex: 1, minWidth: 0 },
  hubRowTitle: { fontSize: 16, fontWeight: '600', color: brandColors.cream },
  hubRowSub: { marginTop: 2, fontSize: 13 },
});
