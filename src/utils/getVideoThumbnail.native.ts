import { Thumbnail } from "../types";
import { getFileNameWithoutExtension } from "./common";
import { Video } from "react-native-compressor";

export const getMobileThumbnail = async (
  videoUri: string,
  fileName: string
): Promise<Thumbnail | null> => {
  try {
    const thumbnailUri = await Video.getThumbnail(videoUri);

    if (!thumbnailUri) {
      console.warn("⚠️ Could not generate thumbnail.");
      return null;
    }

    const baseName = getFileNameWithoutExtension(fileName);

    return {
      uri: thumbnailUri.startsWith("file://") ? thumbnailUri : `file://${thumbnailUri}`,
      mimeType: "image/jpeg",
      name: `${baseName}_thumbnail.jpg`,
    };
  } catch (error) {
    console.error("❌ Thumbnail generation error:", error);
    return null;
  }
};