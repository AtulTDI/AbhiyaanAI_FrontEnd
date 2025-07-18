import { MD3LightTheme as DefaultTheme, MD3Theme, configureFonts } from 'react-native-paper';
import colors from './constants/colors';

const fontConfig = {
  config: {
    titleLarge: {
      fontFamily: 'System',
      fontWeight: '500' as const,
      fontSize: 22,
      letterSpacing: 0,
      lineHeight: 28,
    },
    bodyMedium: {
      fontFamily: 'System',
      fontWeight: '400' as const,
      fontSize: 14,
      letterSpacing: 0.25,
      lineHeight: 20,
    },
    labelLarge: {
      fontFamily: 'System',
      fontWeight: '500' as const,
      fontSize: 14,
      letterSpacing: 0.1,
      lineHeight: 20,
    },
  },
};

export const customTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    ...colors,
    elevation: {
      level0: 'transparent',
      level1: colors.white,
      level2: colors.softGray,
      level3: colors.softGray,
      level4: colors.softGray,
      level5: colors.softGray,
    },
  },
  fonts: configureFonts(fontConfig),
  roundness: 8,
};

export type AppTheme = MD3Theme & {
  colors: MD3Theme['colors'] & typeof colors;
};