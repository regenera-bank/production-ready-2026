import colorTokens from '../../../tokens/color.json';
import typographyTokens from '../../../tokens/typography.json';
import spacingTokens from '../../../tokens/spacing.json';
import radiusTokens from '../../../tokens/radius.json';
import elevationTokens from '../../../tokens/elevation.json';
import motionTokens from '../../../tokens/motion.json';

export const regeneraTokens = {
  color: colorTokens.color,
  fontFamily: typographyTokens.fontFamily,
  fontWeight: typographyTokens.fontWeight,
  fontSize: typographyTokens.fontSize,
  spacing: spacingTokens.spacing,
  radius: radiusTokens.radius,
  elevation: elevationTokens.elevation,
  motion: motionTokens,
} as const;

export type RegeneraColorToken = keyof typeof regeneraTokens.color;