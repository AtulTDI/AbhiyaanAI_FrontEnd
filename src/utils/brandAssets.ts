import abhiyanIcon from '../../assets/abhiyan/icon.png';
import rajyogIcon from '../../assets/rajyog/icon.png';
import Constants from 'expo-constants';
import { ImageSourcePropType } from 'react-native';

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
