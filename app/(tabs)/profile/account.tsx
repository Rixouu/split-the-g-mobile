import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AuthSignInButtons } from '@/components/auth/auth-sign-in-buttons';
import { ProfileCountryPicker } from '@/components/profile/profile-country-picker';
import { AppButton } from '@/components/split-the-g/button';
import { Card, Screen, UNDER_STACK_HEADER_SAFE_AREA_EDGES } from '@/components/split-the-g/screen';
import { ScreenLoadingBlock } from '@/components/split-the-g/screen-loading';
import { Body, Muted } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import { getCachedAnalyticsConsent, persistAnalyticsConsent, type AnalyticsConsentStatus } from '@/lib/analytics/consent';
import { fetchPublicProfile, upsertPublicProfile } from '@/lib/api/profile';
import { useAuth } from '@/lib/auth/auth-context';
import { fetchLeaderboardDisplayNameForUser } from '@/lib/auth/leaderboard-display-name';
import { useLocale } from '@/lib/i18n/locale-context';
import { registerForPushNotifications } from '@/lib/notifications/register';
import { containsObjectionableText } from '@/lib/moderation/content-safety';
import { supabase } from '@/lib/supabase/client';
import { flagEmojiFromIso2 } from '@/lib/utils/country-display';
import { getCountryOptions } from '@/lib/utils/country-options';

export default function ProfileAccountScreen() {
  const { user, signOut, deleteAccount, isLoading, isConfigured } = useAuth();
  const { t, locale } = useLocale();
  const qc = useQueryClient();

  const [displayName, setDisplayName] = useState('');
  const [nickname, setNickname] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [analyticsConsent, setAnalyticsConsent] = useState<AnalyticsConsentStatus>('unset');
  const [pushGranted, setPushGranted] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const countryOptions = useMemo(() => getCountryOptions(), []);

  const profileQuery = useQuery({
    queryKey: ['publicProfile', user?.id],
    queryFn: () => fetchPublicProfile(user!.id),
    enabled: Boolean(user?.id),
  });

  useEffect(() => {
    const p = profileQuery.data;
    if (!p) return;
    setDisplayName(p.display_name?.trim() || '');
    setNickname(p.nickname?.trim() || '');
    setCountryCode(p.country_code?.trim().toUpperCase() || '');
  }, [profileQuery.data]);

  useFocusEffect(
    useCallback(() => {
      setAnalyticsConsent(getCachedAnalyticsConsent());
      void (async () => {
        try {
          const Notifications = await import('expo-notifications');
          const r = await Notifications.getPermissionsAsync();
          setPushGranted(r.status === 'granted');
        } catch {
          setPushGranted(false);
        }
      })();
    }, []),
  );

  useEffect(() => {
    if (!feedback) return;
    const tmr = setTimeout(() => setFeedback(null), 2800);
    return () => clearTimeout(tmr);
  }, [feedback]);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      if (containsObjectionableText(displayName) || containsObjectionableText(nickname)) {
        throw new Error('That profile name is not allowed. Please choose another name.');
      }
      await upsertPublicProfile(user.id, {
        display_name: displayName.trim() || user.email?.split('@')[0] || 'Player',
        nickname: nickname.trim() || null,
        country_code: countryCode.trim() || null,
      });
      const leaderboardName = await fetchLeaderboardDisplayNameForUser(user);
      const { error: rpcErr } = await supabase.rpc('sync_scores_username_for_jwt', {
        p_username: leaderboardName,
      });
      if (rpcErr) {
        const { error: serr } = await supabase
          .from('scores')
          .update({ username: leaderboardName })
          .eq('email', user.email?.trim() ?? '');
        if (serr) throw serr;
      }
    },
    onSuccess: async () => {
      setSaveMsg(t('profileAccountSaved'));
      await qc.invalidateQueries({ queryKey: ['publicProfile', user?.id] });
      await qc.invalidateQueries({ queryKey: ['myScores', user?.id] });
      await qc.invalidateQueries({ queryKey: ['publicProfileCountry', user?.id] });
      await qc.invalidateQueries({ queryKey: ['profileHub', user?.id] });
    },
    onError: (e: Error) => {
      setSaveMsg(e.message);
    },
  });

  const cc = countryCode.trim().toUpperCase();
  const nameLine =
    (cc && /^[A-Z]{2}$/.test(cc) ? `${flagEmojiFromIso2(cc)} ` : '') + (displayName.trim() || '—');

  return (
    <Screen edges={UNDER_STACK_HEADER_SAFE_AREA_EDGES}>
      {!isConfigured ? (
        <Card>
          <Body>{t('errorSupabaseEnvTitle')}</Body>
          <Muted>{t('errorSupabaseEnvBody')}</Muted>
        </Card>
      ) : null}

      {isLoading ? <ScreenLoadingBlock /> : null}

      {!isLoading && !user ? (
        <Card>
          <Body>{t('signInPrompt')}</Body>
          <AuthSignInButtons />
        </Card>
      ) : null}

      {user ? (
        <Card>
          <View style={styles.hero}>
            <View style={styles.avatar} accessibilityRole="image" accessibilityLabel={t('profileAccountProfilePhotoSimpleAria')}>
              <Ionicons name="person" size={38} color={brandColors.gold} />
            </View>
            <Text style={styles.signedIn}>{t('profileAccountSignedIn')}</Text>
            <Muted style={styles.email} numberOfLines={1}>
              {user.email}
            </Muted>
            <Text style={styles.namePreview} numberOfLines={2}>
              {nameLine}
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('profileAccountDisplayName')}</Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder={t('profileAccountNamePlaceholder')}
              placeholderTextColor={brandColors.tanMuted}
              style={styles.input}
              autoCapitalize="words"
              autoComplete="name"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('profileAccountNickname')}</Text>
            <TextInput
              value={nickname}
              onChangeText={setNickname}
              placeholder={t('profileAccountNicknamePlaceholder')}
              placeholderTextColor={brandColors.tanMuted}
              style={styles.input}
              maxLength={30}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Muted style={styles.hint}>{t('profileAccountNicknameHint')}</Muted>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('profileAccountCountry')}</Text>
            <ProfileCountryPicker
              value={countryCode}
              onChange={(c) => setCountryCode(c.trim().toUpperCase())}
              options={countryOptions}
              notSetLabel={t('profileAccountCountryNotSet')}
              sheetTitle={t('profileAccountCountry')}
              searchPlaceholder={t('profileAccountCountrySearchPlaceholder')}
              noMatchesLabel={t('profileAccountCountryNoMatches')}
            />
            <Muted style={styles.hint}>{t('profileAccountCountryHint')}</Muted>
          </View>

          {saveMsg ? <Muted style={styles.saveMsg}>{saveMsg}</Muted> : null}
          {feedback ? <Muted style={styles.saveMsg}>{feedback}</Muted> : null}

          <AppButton
            label={saveMut.isPending ? t('profileAccountSaving') : t('profileAccountSave')}
            shape="rounded"
            fullWidth
            disabled={saveMut.isPending}
            onPress={() => {
              setSaveMsg(null);
              saveMut.mutate();
            }}
          />

          <View style={styles.sectionDivider} />

          <View style={styles.innerCard}>
            <Text style={styles.innerTitle}>{t('profileAccountTrackingTitle')}</Text>
            <Muted style={styles.innerBody}>{t('profileAccountTrackingBody')}</Muted>
            <View style={styles.analyticsRow}>
              <Pressable
                onPress={() => {
                  void (async () => {
                    await persistAnalyticsConsent('accepted');
                    setAnalyticsConsent('accepted');
                    setFeedback(t('profileAccountAnalyticsEnabledToast'));
                  })();
                }}
                style={({ pressed }) => [
                  styles.chip,
                  analyticsConsent === 'accepted' ? styles.chipOn : styles.chipOff,
                  pressed && styles.pressed,
                ]}>
                <Text style={analyticsConsent === 'accepted' ? styles.chipOnLabel : styles.chipOffLabel}>
                  {t('profileAccountAllowAnalytics')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  void (async () => {
                    await persistAnalyticsConsent('rejected');
                    setAnalyticsConsent('rejected');
                    setFeedback(t('profileAccountAnalyticsDisabledToast'));
                  })();
                }}
                style={({ pressed }) => [
                  styles.chip,
                  analyticsConsent === 'rejected' ? styles.chipOn : styles.chipOff,
                  pressed && styles.pressed,
                ]}>
                <Text style={analyticsConsent === 'rejected' ? styles.chipOnLabel : styles.chipOffLabel}>
                  {t('profileAccountDisableAnalytics')}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.innerCard, styles.pushCard]}>
            <Text style={styles.innerTitle}>{t('profileAccountPushTitle')}</Text>
            <Muted style={styles.innerBody}>{t('profileAccountPushBody')}</Muted>
            {pushGranted ? (
              <Muted style={styles.pushStatus}>{t('profileAccountPushEnabled')}</Muted>
            ) : null}
            <AppButton
              label={pushBusy ? t('profileAccountPushBusy') : t('profileAccountEnablePush')}
              variant="secondary"
              shape="rounded"
              fullWidth
              disabled={pushBusy}
              onPress={() => {
                void (async () => {
                  if (!user?.id) return;
                  setPushBusy(true);
                  try {
                    await registerForPushNotifications(user.id, user.email, locale);
                    const Notifications = await import('expo-notifications');
                    const r = await Notifications.getPermissionsAsync();
                    setPushGranted(r.status === 'granted');
                  } finally {
                    setPushBusy(false);
                  }
                })();
              }}
            />
          </View>

          <AppButton
            label={t('profileAccountSignOut')}
            variant="secondary"
            shape="rounded"
            fullWidth
            onPress={() => {
              Alert.alert(t('profileAccountSignOutConfirmTitle'), t('profileAccountSignOutConfirmMessage'), [
                { text: t('profileAccountSignOutConfirmCancel'), style: 'cancel' },
                { text: t('profileAccountSignOut'), style: 'destructive', onPress: () => void signOut() },
              ]);
            }}
          />

          <View style={styles.dangerZone}>
            <Text style={styles.dangerTitle}>{t('profileAccountDeleteTitle')}</Text>
            <Muted style={styles.innerBody}>{t('profileAccountDeleteBody')}</Muted>
            <AppButton
              label={deleteBusy ? t('profileAccountDeleting') : t('profileAccountDeleteButton')}
              variant="secondary"
              shape="rounded"
              fullWidth
              disabled={deleteBusy}
              onPress={() => {
                Alert.alert(
                  t('profileAccountDeleteConfirmTitle'),
                  t('profileAccountDeleteConfirmMessage'),
                  [
                    { text: t('profileAccountDeleteCancel'), style: 'cancel' },
                    {
                      text: t('profileAccountDeleteConfirm'),
                      style: 'destructive',
                      onPress: () => {
                        void (async () => {
                          setDeleteBusy(true);
                          try {
                            await deleteAccount();
                            Alert.alert(
                              t('profileAccountDeleteSuccessTitle'),
                              t('profileAccountDeleteSuccessBody'),
                            );
                          } catch (error) {
                            Alert.alert(
                              t('profileAccountDeleteFailedTitle'),
                              error instanceof Error
                                ? error.message
                                : t('profileAccountDeleteFailedBody'),
                            );
                          } finally {
                            setDeleteBusy(false);
                          }
                        })();
                      },
                    },
                  ],
                );
              }}
            />
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(179, 139, 45, 0.12)',
    marginBottom: 4,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: brandColors.hubStroke,
    backgroundColor: 'rgba(29, 24, 15, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signedIn: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: brandColors.gold,
  },
  email: {
    marginTop: 6,
    textAlign: 'center',
    maxWidth: '100%',
  },
  namePreview: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '600',
    color: brandColors.cream,
    textAlign: 'center',
    lineHeight: 24,
  },
  field: {
    gap: 6,
    marginTop: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    color: 'rgba(212, 183, 143, 0.88)',
    marginBottom: 2,
  },
  hint: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
  },
  input: {
    borderWidth: 1,
    borderColor: brandColors.borderSubtle,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: brandColors.cream,
    backgroundColor: 'rgba(11, 11, 11, 0.45)',
  },
  saveMsg: {
    marginTop: 4,
  },
  sectionDivider: {
    marginTop: 18,
    marginBottom: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(179, 139, 45, 0.12)',
    paddingTop: 16,
  },
  innerCard: {
    borderWidth: 1,
    borderColor: 'rgba(179, 139, 45, 0.22)',
    borderRadius: 10,
    backgroundColor: 'rgba(11, 11, 11, 0.35)',
    padding: 14,
    marginTop: 12,
  },
  pushCard: {
    marginBottom: 4,
  },
  innerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(197, 160, 89, 0.95)',
  },
  innerBody: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 17,
  },
  analyticsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipOn: {
    borderColor: brandColors.gold,
    backgroundColor: brandColors.gold,
  },
  chipOff: {
    borderColor: 'rgba(179, 139, 45, 0.35)',
    backgroundColor: 'transparent',
  },
  chipOnLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: brandColors.black,
  },
  chipOffLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(253, 251, 243, 0.92)',
  },
  pressed: {
    opacity: 0.88,
  },
  pushStatus: {
    marginBottom: 10,
    marginTop: 4,
    fontSize: 13,
  },
  dangerZone: {
    borderWidth: 1,
    borderColor: 'rgba(214, 90, 90, 0.5)',
    borderRadius: 10,
    padding: 14,
    marginTop: 14,
    gap: 12,
  },
  dangerTitle: {
    color: '#f09a9a',
    fontSize: 14,
    fontWeight: '700',
  },
});
