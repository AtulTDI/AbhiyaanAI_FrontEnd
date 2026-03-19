import { ImageSourcePropType } from 'react-native';

import Constants from 'expo-constants';

import abhiyanIcon from '../../assets/abhiyan/icon.png';
import rajyogIcon from '../../assets/rajyog/icon.png';

const BRAND = Constants.expoConfig?.extra?.BRAND ?? 'default';

type BrandAssets = {
  icon: ImageSourcePropType;
};

const brandAssetsMap: Record<string, BrandAssets> = {
  abhiyan: {
    icon: abhiyanIcon
  },
  rajyog: {
    icon: rajyogIcon
  },
  default: {
    icon: abhiyanIcon
  }
};

export const getBrandAssets = (): BrandAssets => {
  return brandAssetsMap[BRAND] || brandAssetsMap.default;
};
