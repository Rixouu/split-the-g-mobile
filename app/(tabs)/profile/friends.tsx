import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppButton } from '@/components/split-the-g/button';
import { Card, Screen } from '@/components/split-the-g/screen';
import { Body, Muted } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import type { FriendRequestRow, UserFriendRow } from '@/lib/api/profile';
import {
  loadSocial,
  removeFriendPair,
  respondFriendRequest,
  sendFriendInvite,
  withdrawFriendRequest,
} from '@/lib/api/profile';
import { normalizeEmail } from '@/lib/utils/profile-email';
import { useAuth } from '@/lib/auth/auth-context';
import { useLocale } from '@/lib/i18n/locale-context';

export default function ProfileFriendsScreen() {
  const { user } = useAuth();
  const { t } = useLocale();
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [banner, setBanner] = useState<string | null>(null);

  const socialQuery = useQuery({
    queryKey: ['social', user?.id, user?.email],
    queryFn: () => loadSocial(user!.id, user!.email ?? null),
    enabled: Boolean(user?.id),
  });

  const inviteMut = useMutation({
    mutationFn: () => {
      if (!user?.id) throw new Error(t('errorSignInRequired'));
      const to = normalizeEmail(email);
      if (to === normalizeEmail(user.email ?? '')) throw new Error(t('errorCannotAddSelf'));
      return sendFriendInvite({ fromUserId: user.id, fromEmail: user.email ?? null, toEmail: to });
    },
    onSuccess: async () => {
      setEmail('');
      setBanner(t('profileFriendsInviteSent'));
      await qc.invalidateQueries({ queryKey: ['social', user?.id, user?.email] });
    },
    onError: (e: Error) => setBanner(e.message),
  });

  const respondMut = useMutation({
    mutationFn: async (p: { row: FriendRequestRow; status: 'accepted' | 'declined' }) => {
      await respondFriendRequest(p.row, p.status, user!.id, user!.email ?? null);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['social', user?.id, user?.email] }),
  });

  const withdrawMut = useMutation({
    mutationFn: (row: FriendRequestRow) => withdrawFriendRequest(row.id, user!.id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['social', user?.id, user?.email] }),
  });

  const removeMut = useMutation({
    mutationFn: (f: UserFriendRow) => {
      if (!user?.id) throw new Error('no user');
      const other = f.user_id === user.id ? f.friend_user_id : f.user_id;
      return removeFriendPair(user.id, other);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['social', user?.id, user?.email] }),
  });

  const outgoing = socialQuery.data?.outgoing ?? [];
  const incoming = socialQuery.data?.incoming ?? [];
  const friends = socialQuery.data?.friends ?? [];

  return (
    <Screen>
      {!user ? (
        <Card>
          <Body>{t('signInPrompt')}</Body>
        </Card>
      ) : null}

      {user ? (
        <Card>
          <Body style={{ fontWeight: '700', marginBottom: 8 }}>{t('profileFriendsTitle')}</Body>
          <Muted style={styles.label}>{t('profileFriendsEmail')}</Muted>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={t('profileFriendsPlaceholder')}
            placeholderTextColor={brandColors.tanMuted}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {banner ? <Muted>{banner}</Muted> : null}
          <AppButton
            label={t('profileFriendsSend')}
            disabled={inviteMut.isPending}
            onPress={() => {
              setBanner(null);
              inviteMut.mutate();
            }}
          />
        </Card>
      ) : null}

      {user && incoming.length > 0 ? (
        <Card>
          <Body style={styles.section}>{t('profileFriendsIncoming')}</Body>
          {incoming.map((r) => (
            <View key={r.id} style={styles.row}>
              <Muted>{r.from_email || r.from_user_id}</Muted>
              <View style={styles.rowBtn}>
                <AppButton
                  label={t('profileFriendsAccept')}
                  onPress={() => respondMut.mutate({ row: r, status: 'accepted' })}
                  disabled={respondMut.isPending}
                />
                <AppButton
                  label={t('profileFriendsDecline')}
                  variant="secondary"
                  onPress={() => respondMut.mutate({ row: r, status: 'declined' })}
                  disabled={respondMut.isPending}
                />
              </View>
            </View>
          ))}
        </Card>
      ) : null}

      {user && outgoing.length > 0 ? (
        <Card>
          <Body style={styles.section}>{t('profileFriendsOutgoing')}</Body>
          {outgoing.map((r) => (
            <View key={r.id} style={styles.row}>
              <Muted>{r.to_email}</Muted>
              <AppButton
                label={t('actionCancel')}
                variant="ghost"
                onPress={() => withdrawMut.mutate(r)}
                disabled={withdrawMut.isPending}
              />
            </View>
          ))}
        </Card>
      ) : null}

      {user && friends.length > 0 ? (
        <Card>
          <Body style={styles.section}>{t('profileFriendsListSection')}</Body>
          {friends.map((f) => {
            const otherEmail = f.peer_email || (f.user_id === user.id ? f.friend_user_id : f.user_id);
            return (
              <View key={`${f.user_id}-${f.friend_user_id}`} style={styles.row}>
                <Muted>{String(otherEmail)}</Muted>
                <AppButton
                  label={t('profileFriendsRemove')}
                  variant="secondary"
                  onPress={() => removeMut.mutate(f)}
                  disabled={removeMut.isPending}
                />
              </View>
            );
          })}
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: 6,
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
    marginBottom: 12,
  },
  section: {
    fontWeight: '700',
    marginBottom: 10,
  },
  row: {
    gap: 10,
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: brandColors.borderSubtle,
  },
  rowBtn: {
    gap: 8,
  },
});
