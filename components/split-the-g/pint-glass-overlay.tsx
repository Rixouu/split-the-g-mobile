import Svg, { Path } from 'react-native-svg';

import { brandColors } from '@/constants/theme';

/**
 * Outline guide aligned with web `~/components/PintGlassOverlay.tsx` (viewBox 400×600).
 * Uniform scale preserves aspect ratio — size via width/height props.
 */
const PINT_GLASS_PATH =
  'M340,100 L337,50a30,30,0,0,0-30-29 H93a30,30,0,0,0-30,29 L60,100 C59.9,102 59.8,104 59.7,106 C58.7,121 58,132 62.7,157 C64,164 67,175 70.7,189 C80.7,227 97,291 97,445 V500a25,25,0,0,0,25,25 H278a25,25,0,0,0,25-25 V445 C303,291 319.7,227 329.7,189 C333,175 336,164 337.3,157 C342,132 341.3,121 340,100Z';

export interface PintGlassOverlayProps {
  width: number;
  height: number;
  /** Default 0.5 matches web `opacity-50` on the pint guide. */
  strokeOpacity?: number;
}

export function PintGlassOverlay({ width, height, strokeOpacity = 0.5 }: PintGlassOverlayProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 400 600" preserveAspectRatio="xMidYMid meet">
      <Path
        d={PINT_GLASS_PATH}
        stroke={brandColors.gold}
        strokeOpacity={strokeOpacity}
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
