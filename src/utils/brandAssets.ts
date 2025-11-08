import { ImageSourcePropType } from "react-native";
import Constants from "expo-constants";

const { BRAND } = Constants.expoConfig?.extra;

type BrandAssets = {
  icon: ImageSourcePropType;
};

const brandAssetsMap: Record<string, BrandAssets> = {
  abhiyan: {
    icon: require("../../assets/abhiyan/icon.png"),
  },
  rajyog: {
    icon: require("../../assets/rajyog/icon.png"),
  },
  default: {
    icon: require("../../assets/abhiyan/icon.png"),
  },
};

export const getBrandAssets = (): BrandAssets => {
  return brandAssetsMap[BRAND] || brandAssetsMap.default;
};
