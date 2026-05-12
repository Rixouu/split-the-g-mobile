import type { User } from '@supabase/supabase-js';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useId, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Stop } from 'react-native-svg';

import { brandColors } from '@/constants/theme';
import { oauthProfilePictureUrl } from '@/lib/auth/oauth-avatar';
import type { AchievementHubSummary } from '@/lib/profile/profile-achievements';

const RING_R = 21;
const RING_CIRC = 2 * Math.PI * RING_R;
const AVATAR_FRAC = 0.68;
const STROKE = brandColors.hubStroke;

/** Matches web `ProfileTierAvatar` hub vs account layout (`h-[4.5rem]` vs `h-[5.75rem]`). */
const VARIANT = {
  hub: {
    outer: 72,
    personIcon: 28,
    crownFont: 10,
    tierNum: 10,
    avatarMax: 54,
    tierPadH: 7,
    tierPadV: 2,
  },
  account: {
    outer: 92,
    personIcon: 34,
    crownFont: 11,
    tierNum: 12,
    avatarMax: 66,
    tierPadH: 8,
    tierPadV: 3,
  },
} as const;

export interface ProfileTierAvatarProps {
  user: User;
  summary: AchievementHubSummary;
  variant?: 'hub' | 'account';
  accessibilityLabel?: string;
}

/**
 * Gold progress ring, avatar, crown + tier — mirrors web `ProfileTierAvatar`.
 */
export function ProfileTierAvatar({
  user,
  summary,
  variant = 'account',
  accessibilityLabel,
}: ProfileTierAvatarProps) {
  const v = VARIANT[variant];
  const outer = v.outer;
  const svgSize = Math.round(outer * 0.78);
  const avatarSide = Math.min(outer * AVATAR_FRAC, v.avatarMax);

  const reactId = useId().replace(/:/g, '');
  const gradId = `stg-tier-ring-${variant}-${reactId}`;
  const photoUrl = useMemo(() => oauthProfilePictureUrl(user), [user]);
  const [loadFailed, setLoadFailed] = useState(false);
  const showPhoto = Boolean(photoUrl) && !loadFailed;

  useEffect(() => {
    setLoadFailed(false);
  }, [photoUrl, user.id]);

  const total = summary.totalCount;
  const unlocked = summary.unlockedCount;
  const ringFillRatio = total > 0 ? Math.min(1, Math.max(0.06, unlocked / total)) : 0.1;
  const ringDash = ringFillRatio * RING_CIRC;

  const showTier = summary.unlockedCount > 0 && summary.maxTierAmongUnlocked > 0;

  return (
    <View
      style={[styles.wrap, { width: outer, height: outer }]}
      accessible={Boolean(accessibilityLabel)}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}>
      <View
        style={[
          styles.ringSlot,
          {
            marginLeft: -svgSize / 2,
            width: svgSize,
            height: svgSize * 0.78,
          },
        ]}>
        <Svg width={svgSize} height={svgSize} viewBox="0 0 72 72" style={styles.svg}>
          <Defs>
            <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="rgb(212, 175, 55)" stopOpacity={0.95} />
              <Stop offset="55%" stopColor="rgb(245, 220, 140)" stopOpacity={0.85} />
              <Stop offset="100%" stopColor="rgb(180, 140, 50)" stopOpacity={0.75} />
            </LinearGradient>
          </Defs>
          <Circle cx={36} cy={36} r={RING_R} stroke="rgba(42,34,17,0.9)" strokeWidth={4} fill="none" />
          <G transform="rotate(-90 36 36)">
            <Circle
              cx={36}
              cy={36}
              r={RING_R}
              stroke={`url(#${gradId})`}
              strokeWidth={4}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${ringDash} ${RING_CIRC}`}
            />
          </G>
        </Svg>
      </View>

      <View
        style={[
          styles.avatar,
          {
            width: avatarSide,
            height: avatarSide,
            top: outer * 0.42,
            marginLeft: -avatarSide / 2,
            marginTop: -avatarSide / 2,
          },
        ]}>
        {showPhoto ? (
          <Image
            source={{ uri: photoUrl }}
            style={styles.avatarImg}
            contentFit="cover"
            onError={() => setLoadFailed(true)}
          />
        ) : (
          <View style={styles.avatarFallback}>
            <Ionicons name="person" size={v.personIcon} color="rgba(179, 139, 45, 0.45)" />
          </View>
        )}
      </View>

      {showTier ? (
        <View
          style={[
            styles.tierBadge,
            {
              paddingHorizontal: v.tierPadH,
              paddingVertical: v.tierPadV,
            },
          ]}
          accessibilityElementsHidden>
          <Text style={[styles.crown, { fontSize: v.crownFont, lineHeight: v.crownFont + 3 }]} accessibilityElementsHidden>
            👑
          </Text>
          <Text style={[styles.tierNum, { fontSize: v.tierNum }]}>{summary.maxTierAmongUnlocked}</Text>
        </View>
      ) : null}
    </View>
  );
}

/** Same as `ProfileTierAvatar` with `variant="account"` — kept for call sites that only use the account screen. */
export function ProfileAccountTierAvatar(props: Omit<ProfileTierAvatarProps, 'variant'>) {
  return <ProfileTierAvatar {...props} variant="account" />;
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  ringSlot: {
    position: 'absolute',
    top: 0,
    left: '50%',
    overflow: 'hidden',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  avatar: {
    position: 'absolute',
    left: '50%',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: STROKE,
    backgroundColor: 'rgba(29, 24, 15, 0.45)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierBadge: {
    position: 'absolute',
    bottom: -2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(179, 139, 45, 0.55)',
    backgroundColor: 'rgba(11, 11, 11, 0.95)',
    shadowColor: '#000',
    shadowOpacity: 0.7,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  crown: {},
  tierNum: {
    fontWeight: '800',
    color: brandColors.goldBright,
    fontVariant: ['tabular-nums'],
  },
});
