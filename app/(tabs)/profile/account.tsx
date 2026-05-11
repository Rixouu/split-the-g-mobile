import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { AppButton } from '@/components/split-the-g/button';
import { Card, Screen } from '@/components/split-the-g/screen';
import { Body, Muted } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import { fetchPublicProfile, upsertPublicProfile } from '@/lib/api/profile';
import { useAuth } from '@/lib/auth/auth-context';
import { fetchLeaderboardDisplayNameForUser } from '@/lib/auth/leaderboard-display-name';
import { useLocale } from '@/lib/i18n/locale-context';
import { registerForPushNotifications } from '@/lib/notifications/register';
import { supabase } from '@/lib/supabase/client';

export default function ProfileAccountScreen() {
  const { user, signOut, signInWithGoogle, isLoading, isConfigured } = useAuth();
  const { t } = useLocale();
  const qc = useQueryClient();

  const [displayName, setDisplayName] = useState('');
  const [nickname, setNickname] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

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
    setCountryCode(p.country_code?.trim() || '');
  }, [profileQuery.data]);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
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
    },
    onError: (e: Error) => {
      setSaveMsg(e.message);
    },
  });

  return (
    <Screen>
      {!isConfigured ? (
        <Card>
          <Body>{t('errorSupabaseEnvTitle')}</Body>
          <Muted>{t('errorSupabaseEnvBody')}</Muted>
        </Card>
      ) : null}

      {isLoading ? (
        <Card>
          <Body>{t('commonLoading')}</Body>
        </Card>
      ) : null}

      {!isLoading && !user ? (
        <Card>
          <Body>{t('signInPrompt')}</Body>
          <AppButton label={t('signInGoogle')} onPress={signInWithGoogle} />
        </Card>
      ) : null}

      {user ? (
        <>
          <Card>
            <Muted>{user.email}</Muted>
            <AppButton label={t('profileAccountEnablePush')} onPress={() => registerForPushNotifications(user.id)} />
            <AppButton label={t('profileAccountSignOut')} variant="secondary" onPress={signOut} />
          </Card>

          <Card>
            <Body style={styles.label}>{t('profileAccountDisplayName')}</Body>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Alex"
              placeholderTextColor={brandColors.tanMuted}
              style={styles.input}
              autoCapitalize="words"
            />
            <Body style={styles.label}>{t('profileAccountNickname')}</Body>
            <TextInput
              value={nickname}
              onChangeText={setNickname}
              placeholder="Pub nickname"
              placeholderTextColor={brandColors.tanMuted}
              style={styles.input}
            />
            <Body style={styles.label}>{t('profileAccountCountry')}</Body>
            <TextInput
              value={countryCode}
              onChangeText={setCountryCode}
              placeholder="GB"
              placeholderTextColor={brandColors.tanMuted}
              style={styles.input}
              autoCapitalize="characters"
            />
            {saveMsg ? <Muted>{saveMsg}</Muted> : null}
            <AppButton
              label={t('profileAccountSave')}
              disabled={saveMut.isPending}
              onPress={() => {
                setSaveMsg(null);
                saveMut.mutate();
              }}
            />
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: brandColors.borderSubtle,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: brandColors.cream,
    marginBottom: 14,
    backgroundColor: 'rgba(11, 11, 11, 0.45)',
  },
});
