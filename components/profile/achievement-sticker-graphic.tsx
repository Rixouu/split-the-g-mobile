import type { FC } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { SvgProps } from 'react-native-svg';

import S001 from '@/assets/icons/stickers/001-beer.svg';
import S002 from '@/assets/icons/stickers/002-beer.svg';
import S003 from '@/assets/icons/stickers/003-beer.svg';
import S004 from '@/assets/icons/stickers/004-beer.svg';
import S005 from '@/assets/icons/stickers/005-beer.svg';
import S006 from '@/assets/icons/stickers/006-beer.svg';
import S007 from '@/assets/icons/stickers/007-beer.svg';
import S008 from '@/assets/icons/stickers/008-beer.svg';
import S009 from '@/assets/icons/stickers/009-beer.svg';
import S010 from '@/assets/icons/stickers/010-beer.svg';
import S011 from '@/assets/icons/stickers/011-beer.svg';
import S012 from '@/assets/icons/stickers/012-beer.svg';
import S013 from '@/assets/icons/stickers/013-beer.svg';
import S014 from '@/assets/icons/stickers/014-beer.svg';
import S015 from '@/assets/icons/stickers/015-beer.svg';
import S016 from '@/assets/icons/stickers/016-beer.svg';
import S017 from '@/assets/icons/stickers/017-beer.svg';
import S018 from '@/assets/icons/stickers/018-beer.svg';
import S019 from '@/assets/icons/stickers/019-beer.svg';
import S020 from '@/assets/icons/stickers/020-beer.svg';

/** Same numbering as web `public/icons/stickers/{NNN}-beer.svg` and `PROFILE_ACHIEVEMENT_DEFS.stickerNum`. */
const STICKER_BY_NUM: Record<number, FC<SvgProps>> = {
  1: S001,
  2: S002,
  3: S003,
  4: S004,
  5: S005,
  6: S006,
  7: S007,
  8: S008,
  9: S009,
  10: S010,
  11: S011,
  12: S012,
  13: S013,
  14: S014,
  15: S015,
  16: S016,
  17: S017,
  18: S018,
  19: S019,
  20: S020,
};

interface AchievementStickerGraphicProps {
  stickerNum: number;
  size?: number;
  locked?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function AchievementStickerGraphic({
  stickerNum,
  size = 56,
  locked = false,
  style,
}: AchievementStickerGraphicProps) {
  const Cmp = STICKER_BY_NUM[stickerNum];
  if (!Cmp) {
    return (
      <View style={[styles.wrap, { width: size, height: size }, style]} accessibilityElementsHidden>
        <Text style={[styles.fallback, { lineHeight: size }]}>🍺</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, locked && styles.locked, { width: size, height: size }, style]}>
      <Cmp width={size} height={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  locked: {
    opacity: 0.32,
  },
  fallback: {
    fontSize: 36,
    textAlign: 'center',
  },
});
